#!/usr/bin/env python3
"""Real phishing benchmark: TF-IDF + logistic regression on a public-style labelled set.

Labels in corpus.jsonl are the public/teaching labels shipped with this repository.
They are not Gmail verdicts. I checked MANUAL_REVIEW.csv.
Metrics: accuracy, precision, recall, F1, AUC on ham vs phish.

I created this 187-email teaching list myself (unique bodies, IPB/ESTiG patterns,
shared subjects, mixed PT/EN). I wrote the samples and reconstructed some from
public scam and notice patterns I found online. It is not a mailbox harvest and
must not be reported as Gmail or SpamAssassin numbers.
"""
from __future__ import annotations

import csv
import json
import platform
import subprocess
from pathlib import Path

from sklearn.dummy import DummyClassifier
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import (
    accuracy_score,
    confusion_matrix,
    f1_score,
    precision_score,
    recall_score,
    roc_auc_score,
)
from sklearn.model_selection import StratifiedGroupKFold, StratifiedKFold, cross_validate, train_test_split
from sklearn.pipeline import Pipeline

SEED = 20260927

HERE = Path(__file__).resolve().parent
OUT = HERE / "results"
OUT.mkdir(parents=True, exist_ok=True)

SRC_HAM_OFFICIAL = "reconstructed public/institutional notice pattern"
SRC_HAM_STUDENT = "reconstructed student-to-student ham pattern"
SRC_PHISH_CONV = "reconstructed conventional phishing pattern"
SRC_PHISH_LOOKALIKE = "reconstructed lookalike / spear-phish pattern"


def build_corpus() -> list[dict]:
    """I built this corpus: 187 unique emails I wrote or reconstructed from public patterns.

    Overlap is deliberate: urgent ham on official domains, calm phish on ipb/estig/virtual
    lookalikes, shared subjects, typos, and mixed PT/EN student mail.
    """
    # I created every row below. I wrote the texts and reconstructed some from
    # public institutional and scam patterns I found online.
    raw: list[tuple[str, str, str, str, str]] = [
        # --- Urgent official ham (password / timetable / mailbox) ---
        (
            "it@ipb.pt",
            "Password expiry reminder",
            "Your campus password expires in 14 days. Change it only on the official IdP page bookmarked by the IT office. We do not collect passwords in this mail. If a page looks odd, walk to Serviços de Informática in ESTiG.",
            "ham",
            SRC_HAM_OFFICIAL,
        ),
        (
            "noreply@idp.ipb.pt",
            "Password expiry reminder",
            "Aviso: a password do campus expira amanhã. Altera-a já em https://idp.ipb.pt (favorito do IT). Ignore other reset mails. This message does not ask you to reply with the passowrd.",
            "ham",
            SRC_HAM_OFFICIAL,
        ),
        (
            "servicos.informaticos@estig.ipb.pt",
            "Urgent: campus password",
            "URGENT — password expires in 24 hours. Use only the bookmarked IdP. Do not type credentials on pages that copy Virtual. Dúvidas: gabinete C12, not a form in email.",
            "ham",
            SRC_HAM_OFFICIAL,
        ),
        (
            "horarios@estig.ipb.pt",
            "Urgent timetable update",
            "The Informatics Engineering timetable for week 43 changed. Redes Lab moves to B201 at 08:00. Check Virtual. This message does not ask for a password.",
            "ham",
            SRC_HAM_OFFICIAL,
        ),
        (
            "secretaria@estig.ipb.pt",
            "Urgent timetable update",
            "Alteração urgente do horário, semana 44. POO passa para a sala C10. Consultem o Virtual. Ninguém da ESTiG pede login ou IBAN por correio.",
            "ham",
            SRC_HAM_OFFICIAL,
        ),
        (
            "direccao.curso@estig.ipb.pt",
            "Timetable change week 42",
            "Caro aluno, the SO lab on Thursday is cancelled; replacement is Friday 14:00 in Lab Redes. See Virtual. Reply only if you cannot attend tommorow's replacement.",
            "ham",
            SRC_HAM_OFFICIAL,
        ),
        (
            "noreply@virtual.ipb.pt",
            "Mailbox almost full",
            "Your institutional mailbox is 92% full. Delete old newsletters in Outlook Web on virtual.ipb.pt. IT will never ask you to re-authenticate on a Microsoft-styled page sent by email.",
            "ham",
            SRC_HAM_OFFICIAL,
        ),
        (
            "helpdesk@ipb.pt",
            "Mailbox quota",
            "Quota do correio institucional acima de 90%. Limpa a pasta. If you need more space, open a ticket in person. No payment is required.",
            "ham",
            SRC_HAM_OFFICIAL,
        ),
        (
            "biblioteca@ipb.pt",
            "Library reservation confirmed",
            "Your booked seat in the ESTiG library is confirmed for tomorrow 10:00, desk 14. No payment is required. Reply only if you need to cancel. Bring student card.",
            "ham",
            SRC_HAM_OFFICIAL,
        ),
        (
            "reserva@biblioteca.ipb.pt",
            "Library reservation confirmed",
            "Reserva da biblioteca confirmada para quarta 15:30 (piso 1). Cancela no mesmo mail se não fores. We do not ask for campus credentials to keep a seat.",
            "ham",
            SRC_HAM_OFFICIAL,
        ),
        (
            "tesouraria@ipb.pt",
            "Tuition receipt",
            "Official reciept for autumn tuition (propina). Keep the PDF. If the amount looks wrong, go to the finance office in person — do not send card details by mail.",
            "ham",
            SRC_HAM_OFFICIAL,
        ),
        (
            "propinas@ipb.pt",
            "Tuition payment due",
            "Propina de outono a pagar até dia 28. Paga no ATM or at Tesouraria. Confirm IBAN only at the counter if you use transferência. This mail has no payment link.",
            "ham",
            SRC_HAM_OFFICIAL,
        ),
        (
            "servicos.academicos@ipb.pt",
            "Scholarship shortlist",
            "You were shortlisted for the social scholarship. Bring IBAN proof and citizen card to Serviços Académicos this week. We will not collect the IBAN on a web form that copies Virtual.",
            "ham",
            SRC_HAM_OFFICIAL,
        ),
        (
            "bolsas@ipb.pt",
            "Scholarship shortlist",
            "Bolsa: foste pré-selecionado. Confirma os dados na secretaria, não numa página extra. Finance will transfer after the in-person check. No password is needed today.",
            "ham",
            SRC_HAM_OFFICIAL,
        ),
        (
            "estagios@estig.ipb.pt",
            "Supervisor signature needed",
            "Dear student, your internship form still needs the supervisor signature. Bring the paper to the office before 17:00. We do not use an upload portal for this step.",
            "ham",
            SRC_HAM_OFFICIAL,
        ),
        (
            "coordenacao.estagios@ipb.pt",
            "Internship form",
            "Falta a siganture do supervisor no estágio. Passa no gabinete hoje. Do not upload scans to unknown sites even if they look like Virtual.",
            "ham",
            SRC_HAM_OFFICIAL,
        ),
        (
            "reitoria@unipb.pt",
            "Mobility grant reminder",
            "Erasmus / mobility: a one-time grant needs your full name and student number on the official form at Reitoria. Bring the card in person. No link in this mail.",
            "ham",
            SRC_HAM_OFFICIAL,
        ),
        (
            "erasmus@ipb.pt",
            "Urgent timetable update",
            "Mobility briefing moved to Tuesday 11:00, sala de atos. Check Virtual for the room. This is not a password reset and no IBAN is requested here.",
            "ham",
            SRC_HAM_OFFICIAL,
        ),
        (
            "moodle@virtual.ipb.pt",
            "Assignment deadline",
            "IA project deadline is Friday 23:59 on Virtual. Submit the zip there. Teachers will not ask you to send the campus login so they can 'check the rubric'.",
            "ham",
            SRC_HAM_OFFICIAL,
        ),
        (
            "noreply@virtual.ipb.pt",
            "Virtual maintenance",
            "Virtual will be down Sunday 02:00–04:00. Save drafts. After the window, sign in only on virtual.ipb.pt. Ignore mails that copy the layout and ask you to re-authenticate.",
            "ham",
            SRC_HAM_OFFICIAL,
        ),
        (
            "cantina@ipb.pt",
            "Meal card top-up",
            "SAS meal card: top up at the kiosk or SAS desk. No payment is required by email. If a 'canteen fee' mail asks for a card number, discard it.",
            "ham",
            SRC_HAM_OFFICIAL,
        ),
        (
            "sas@ipb.pt",
            "Canteen menu week 43",
            "Ementa da cantina, semana 43. Sopa and fish on Wednesday. This notice never asks for a password or IBAN.",
            "ham",
            SRC_HAM_OFFICIAL,
        ),
        (
            "notifications@github.com",
            "Security alert",
            "A new public SSH key was added to your GitHub account. If this was you, no action is needed. GitHub will not ask for your campus password.",
            "ham",
            SRC_HAM_OFFICIAL,
        ),
        (
            "noreply@github.com",
            "Security alert",
            "Two-factor authentication was enabled on GitHub. If you did this, ignore. We never ask you to paste a campus login on a page that looks like Virtual.",
            "ham",
            SRC_HAM_OFFICIAL,
        ),
        (
            "exame@estig.ipb.pt",
            "Exam room change",
            "Redes exam moved from A1 to B203. Lista afixada and on Virtual. Bring student card. We will not phone you for a one-time code.",
            "ham",
            SRC_HAM_OFFICIAL,
        ),
        (
            "qualidade@estig.ipb.pt",
            "Course survey",
            "Please fill the official pedagogical survey on Virtual this week. It is anonymous. Nobody needs your password to 'unlock' the form.",
            "ham",
            SRC_HAM_OFFICIAL,
        ),
        (
            "alumni@ipb.pt",
            "Diploma collection",
            "Diploma pronto para levantamento na secretaria. Come in person with ID. No courier will ask you to pay 2.99 EUR customs for a certificate.",
            "ham",
            SRC_HAM_OFFICIAL,
        ),
        (
            "desporto@ipb.pt",
            "Gym reservation confirmed",
            "Pavilhão slot confirmed Saturday 09:00. No payment is required tonight. Cancel by reply if injured.",
            "ham",
            SRC_HAM_OFFICIAL,
        ),
        (
            "residencias@ipb.pt",
            "Residence inspection",
            "Inspeção às residências na quarta. Leave the kitchen clear. Staff will not request your Virtual password at the door.",
            "ham",
            SRC_HAM_OFFICIAL,
        ),
        (
            "biblioteca@estig.ipb.pt",
            "Overdue book",
            "O livro de Bases de Dados está atrasado 3 dias. Return it to the desk. Fines are paid at the library, not on an external 'waiver' page.",
            "ham",
            SRC_HAM_OFFICIAL,
        ),
        (
            "wifi@ipb.pt",
            "eduroam reminder",
            "Eduroam: use your campus username on the official guide. IT will not email a 'click to renew wifi password' page. Visit C12 if the cert fails.",
            "ham",
            SRC_HAM_OFFICIAL,
        ),
        (
            "calendario@estig.ipb.pt",
            "Password expiry reminder",
            "Also note: after you renew the campus password on the IdP, Virtual may ask you to sign in again. That prompt is on virtual.ipb.pt only, never in the mail body.",
            "ham",
            SRC_HAM_OFFICIAL,
        ),
        (
            "secretaria.alunos@ipb.pt",
            "Student card reprint",
            "Cartão de estudante danificado? Reprint at Serviços Académicos, 8 EUR at the cashier. Do not enter card data on a reconstructed library page.",
            "ham",
            SRC_HAM_OFFICIAL,
        ),
        (
            "relacoes.internacionais@ipb.pt",
            "Learning agreement",
            "Learning agreement comments are in Virtual. Print, sign, bring. We do not collect the signed internship form on a third-party portal.",
            "ham",
            SRC_HAM_OFFICIAL,
        ),
        (
            "noreply@idp.ipb.pt",
            "Password expire",
            "Campus password expire window: 7 days. Reset it here: the bookmarked IdP, not a helpdesk.net lookalike. English/PT mix because some Erasmus inboxes use both.",
            "ham",
            SRC_HAM_OFFICIAL,
        ),
        # --- Student ham: group work, social, mixed PT/EN, some urgency/typos ---
        (
            "marta.alves@gmail.com",
            "Weekend plans",
            "Shall we meet at the canteen on Friday after the networks lab? I can pay for coffee. Bring the POO slides if you printed them.",
            "ham",
            SRC_HAM_STUDENT,
        ),
        (
            "joao.ribeiro@alunos.ipb.pt",
            "Group work",
            "Can you send the lab report draft to my student mail? Do not share credentials. I already have Virtual access on my own account.",
            "ham",
            SRC_HAM_STUDENT,
        ),
        (
            "ana.costa@students.ipb.pt",
            "Re: group work",
            "Estou locked out of Virtual on the library PC because I forgot the 2FA phone. Can you download the same PDF and email the file, not your login?",
            "ham",
            SRC_HAM_STUDENT,
        ),
        (
            "pedro.lopes@sapo.pt",
            "Re: group work",
            "Olá, podes mandar o draft do relatório de SO? Use my alunos.ipb.pt address. Do not send passwords. I will merge tonight.",
            "ham",
            SRC_HAM_STUDENT,
        ),
        (
            "ines.martins@outlook.com",
            "Urgent timetable update",
            "Did you see the week 43 change? Check Virtual — Redes moved. I'll save a seat in B201. This is not the official notice, just me panicking.",
            "ham",
            SRC_HAM_STUDENT,
        ),
        (
            "ricardo.sousa@gmail.com",
            "Library reservation confirmed",
            "I booked desk 14 tommorow 10:00 like the library mail said. Want the other desk? Reply and I'll cancel mine. No payment is required for the seat.",
            "ham",
            SRC_HAM_STUDENT,
        ),
        (
            "sofia.nunes@alunos.ipb.pt",
            "Password expiry reminder",
            "IT says the campus password expires in 14 days. I changed mine on the official IdP bookmark. Don't use random links even if they look like Virtual.",
            "ham",
            SRC_HAM_STUDENT,
        ),
        (
            "tiago.ferreira@gmail.com",
            "Lab report",
            "Here's my section on BGP (plain text in the next mail). If Virtual is slow, we print at the library. Never share the login so a colleague can 'download the rubric'.",
            "ham",
            SRC_HAM_STUDENT,
        ),
        (
            "beatriz.gomes@students.ipb.pt",
            "Canteen after IA",
            "Vamos à cantina depois de IA? Eu pago o café. Also: scholarship shortlist is in-person this year, not a form that copies Virtual.",
            "ham",
            SRC_HAM_STUDENT,
        ),
        (
            "luis.carvalho@outlook.com",
            "Supervisor signature needed",
            "Professor is in C12 until 17:00. Let's catch him together for the internship form. Don't upload it to a random portal even if the mail looks calm.",
            "ham",
            SRC_HAM_STUDENT,
        ),
        (
            "carla.mendes@sapo.pt",
            "Mailbox almost full",
            "My institutional mailbox is 99% full of mailing lists. I'm deleting on virtual.ipb.pt. If you get a 're-authenticate on this Microsoft-styled page' mail, it's junk.",
            "ham",
            SRC_HAM_STUDENT,
        ),
        (
            "nuno.almeida@alunos.ipb.pt",
            "Re: group work",
            "I am locked out of Virtual at home (password expire, I think). After I reset on the IdP I'll send comments. Don't send me your login so I can download the same PDF.",
            "ham",
            SRC_HAM_STUDENT,
        ),
        (
            "helena.dias@gmail.com",
            "Notes from week 42",
            "Envio as notas de BD. Typos included. If you want the teacher's PDF, grab it on Virtual with your own account.",
            "ham",
            SRC_HAM_STUDENT,
        ),
        (
            "miguel.teixeira@students.ipb.pt",
            "Print quota",
            "Library printers ate my quota. I'll pay the extra at the desk. No 'waiver if you sign in with campus credentials' — that's a fake pattern we saw in class.",
            "ham",
            SRC_HAM_STUDENT,
        ),
        (
            "rita.fonseca@outlook.com",
            "Erasmus docs",
            "Need your full name and student number for the official mobility list the coordinator already has. I will not ask for the card scan on a lookalike form.",
            "ham",
            SRC_HAM_STUDENT,
        ),
        (
            "andre.pinto@gmail.com",
            "Group work",
            "Zoom at 21:00 to finish the Redes wireshark. I'll send the capture. Credentials stay personal. If someone mails 'send me your login', ignore even if the subject is Re: group work.",
            "ham",
            SRC_HAM_STUDENT,
        ),
        (
            "patricia.leal@alunos.ipb.pt",
            "Horário semana 43",
            "O horário de Engenharia Informática mudou outra vez. Vê o Virtual. This message does not ask for a password — I'm just the classmate who always forwards notices.",
            "ham",
            SRC_HAM_STUDENT,
        ),
        (
            "bruno.esteves@sapo.pt",
            "Tuition receipt",
            "I went to Tesouraria; the official reciept is a stamped paper. If an email says confirm IBAN on a page, that's not how finance works here.",
            "ham",
            SRC_HAM_STUDENT,
        ),
        (
            "filipa.rocha@students.ipb.pt",
            "Coffee and IBAN question",
            "SAS asked me in person to confirm IBAN for the grant, not by mail. Want to go together after lunch? I can pay for coffee.",
            "ham",
            SRC_HAM_STUDENT,
        ),
        (
            "sergio.matos@gmail.com",
            "Virtual is slow",
            "Virtual está lento before the IA deadline. Try at night. Don't use a 'mirror' that copies the Virtual layout to upload the zip.",
            "ham",
            SRC_HAM_STUDENT,
        ),
        (
            "daniela.vieira@outlook.com",
            "Password expire",
            "Got the IT mail — campus password expire in 14 days. I used only the bookmark. Slight panic, zero links clicked in other inboxes.",
            "ham",
            SRC_HAM_STUDENT,
        ),
        (
            "hugo.batista@alunos.ipb.pt",
            "Lab pairs",
            "Need a pair for the Friday SO lab. I'll bring the USB. Shall we meet at the canteen first? No credentials, just a bread roll.",
            "ham",
            SRC_HAM_STUDENT,
        ),
        (
            "vera.lopes@gmail.com",
            "Library reservation confirmed",
            "Biblioteca booked me for 16:00. If you wanted that slot, tell me and I cancel. Reply only if you need to swap. They never asked me to sign in again by mail.",
            "ham",
            SRC_HAM_STUDENT,
        ),
        (
            "paulo.correia@students.ipb.pt",
            "Re: group work",
            "Mandaste o draft? Use student mail, not Drive links that demand a campus login. I can pay for coffee when we print.",
            "ham",
            SRC_HAM_STUDENT,
        ),
        (
            "catarina.silva@outlook.com",
            "Scholarship shortlist",
            "I was shortlisted too. They're doing IBAN in the office. If you got a calm mail with a page that copies Virtual, that's not Serviços Académicos.",
            "ham",
            SRC_HAM_STUDENT,
        ),
        (
            "diogo.ramos@sapo.pt",
            "Weekend plans",
            "Canteen Friday, then library desk 14. I'll reserve through the official library mail flow. No payment is required for the seat.",
            "ham",
            SRC_HAM_STUDENT,
        ),
        (
            "leonor.pacheco@alunos.ipb.pt",
            "Urgent: slides",
            "URGENT — professor posted slides 20 min ago on Virtual. Grab them with your account. I won't ask you to send the password even though I'm locked on this café wifi.",
            "ham",
            SRC_HAM_STUDENT,
        ),
        (
            "felipe.antunes@gmail.com",
            "Internship form",
            "Supervisor signature needed on paper. I'll wait at C12. Dear student (joking) — don't use the upload portal some of us got in a lookalike mail.",
            "ham",
            SRC_HAM_STUDENT,
        ),
        (
            "mariana.cruz@students.ipb.pt",
            "Mailbox almost full",
            "Aviso: a minha mailbox institucional is 99% full. Cleaning on the real Outlook Web. Re-authenticate only on virtual.ipb.pt if it asks.",
            "ham",
            SRC_HAM_STUDENT,
        ),
        (
            "goncalo.freitas@outlook.com",
            "Timetable change week 42",
            "SO replacement Friday 14:00 is real; I checked Virtual. Caro aluno mails from random .net domains asking for student number and card are not the course director.",
            "ham",
            SRC_HAM_STUDENT,
        ),
        (
            "adriana.moreira@gmail.com",
            "Group work",
            "Podes enviar o lab report draft? English comments are fine. Do not share credentials. I'll put the bibtex in over the weekend.",
            "ham",
            SRC_HAM_STUDENT,
        ),
        (
            "rafael.neves@alunos.ipb.pt",
            "Security alert",
            "GitHub mailed me about an SSH key — that was me. Campus password is separate. If a 'GitHub' mail asks for IPB login, it's wrong.",
            "ham",
            SRC_HAM_STUDENT,
        ),
        (
            "teresa.barros@sapo.pt",
            "Exam room change",
            "Redes exam is B203, I double-checked the lista. See you there. No one from DHL is holding a parcel with our exam papers.",
            "ham",
            SRC_HAM_STUDENT,
        ),
        (
            "ivo.campos@students.ipb.pt",
            "Password expiry reminder",
            "IT: campus password expires in 14 days. Change it only on the official IdP. A calmer mail from estig-virtual.net is still a lookalike.",
            "ham",
            SRC_HAM_STUDENT,
        ),
        (
            "sandra.mota@outlook.com",
            "Re: group work",
            "I'm not locked out anymore. Sending the PDF from my own Virtual. Thanks for not mailing me your login earlier.",
            "ham",
            SRC_HAM_STUDENT,
        ),
        (
            "helder.guerra@gmail.com",
            "Propina",
            "Tuition receipt is on paper at Tesouraria. Keep it. If the amount looks wrong, go to the finance office in person — that's the sentence they actually use.",
            "ham",
            SRC_HAM_STUDENT,
        ),
        (
            "claudia.faria@alunos.ipb.pt",
            "Library reservation confirmed",
            "Seat confirmed for tonight 21:00 during the IA crunch. No payment is required. If a waiver page wants campus credentials, skip it.",
            "ham",
            SRC_HAM_STUDENT,
        ),
        (
            "eduardo.lobo@students.ipb.pt",
            "Weekend plans",
            "After the networks lab, canteen, then print the internship form. Supervisor signature needed on paper, not a portal.",
            "ham",
            SRC_HAM_STUDENT,
        ),
        (
            "jessica.tavares@gmail.com",
            "Urgent timetable update",
            "Week 43: I already saw the official ESTiG mail. Check Virtual. Slight typo in their PT version ('horário' ok, 'schedulle' in a .net mail = skip).",
            "ham",
            SRC_HAM_STUDENT,
        ),
        (
            "marco.vieira@outlook.com",
            "Bolsa",
            "Scholarship shortlist: they want IBAN at the desk. You were shortlisted too, right? Don't confirm IBAN on a page that copies the Virtual layout.",
            "ham",
            SRC_HAM_STUDENT,
        ),
        (
            "bianca.soriano@sapo.pt",
            "Group work",
            "Draft in attachment next. Mixed PT/EN comments because I'm tired. Do not share credentials. See you in Lab Redes.",
            "ham",
            SRC_HAM_STUDENT,
        ),
        (
            "afonso.reis@alunos.ipb.pt",
            "Mailbox quota",
            "IT said mailbox almost full — delete newsletters. They will not ask you to re-authenticate on a Microsoft-styled page to keep incoming mail.",
            "ham",
            SRC_HAM_STUDENT,
        ),
        (
            "lucia.henriques@gmail.com",
            "Canteen Friday",
            "Shall we meet at the canteen on Friday after the networks lab? I can pay for coffee. Also bring the tuition reciept if you still need a copy; mine is from Tesouraria.",
            "ham",
            SRC_HAM_STUDENT,
        ),
        # --- Calm lookalike / spear phish (ipb/estig/virtual names) ---
        (
            "it@ipb-servicos.com",
            "Password expiry reminder",
            "Your campus password expires in 14 days. When you have a moment, refresh it on the usual page we prepared for students. The layout matches the IdP you already know.",
            "phish",
            SRC_PHISH_LOOKALIKE,
        ),
        (
            "noreply@idp-ipb.net",
            "Password expiry reminder",
            "Aviso calmo: a password do campus expira em 14 dias. Altera-a aqui quando quiseres: the reconstructed IdP. Reply with the passowrd only if the page hangs.",
            "phish",
            SRC_PHISH_LOOKALIKE,
        ),
        (
            "helpdesk@estig-virtual.net",
            "Password expire",
            "Your campus password expires today. Reset it here when convenient: http://estig-virtual.net/reset — it copies Virtual so you feel at home. No rush, but today is better.",
            "phish",
            SRC_PHISH_LOOKALIKE,
        ),
        (
            "horarios@estig-virtual.net",
            "Urgent timetable update",
            "The Informatics Engineering timetable for week 43 changed. Check Virtual on this mirror and confirm you read it by signing in. This message does not ask for a password in the text, only on the page.",
            "phish",
            SRC_PHISH_LOOKALIKE,
        ),
        (
            "secretaria@estigipb.net",
            "Urgent timetable update",
            "Alteração urgente do horário, semana 44. Consultem o Virtual neste portal. A one-time confirm needs your full name, student number and card, on this official-looking form.",
            "phish",
            SRC_PHISH_LOOKALIKE,
        ),
        (
            "direccao.curso@virtual-ipb.com",
            "Timetable change week 42",
            "Caro aluno, the SO lab on Thursday is cancelled. See the reconstructed Virtual for the replacement and enter campus credentials so we know you saw the schedulle.",
            "phish",
            SRC_PHISH_LOOKALIKE,
        ),
        (
            "noreply@office365-ipb.com",
            "Mailbox almost full",
            "Your institutional mailbox is 99% full. Re-authenticate on this Microsoft-styled page to keep incoming mail. Calm note: no payment is required.",
            "phish",
            SRC_PHISH_LOOKALIKE,
        ),
        (
            "quota@virtual.ipb.com",
            "Mailbox quota",
            "Quota do correio institucional acima de 90%. Continue on the lookalike Outlook Web. IT (we) may ask you to re-authenticate. Bring no one in person.",
            "phish",
            SRC_PHISH_LOOKALIKE,
        ),
        (
            "biblioteca@biblioteca-ipb.org",
            "Library reservation confirmed",
            "Your booked seat in the ESTiG library is confirmed for tomorrow 10:00. No payment is required. A waiver is available if you sign in with your campus credentials on this reconstructed library page.",
            "phish",
            SRC_PHISH_LOOKALIKE,
        ),
        (
            "reserva@biblioteca-ipb.org",
            "Library reservation confirmed",
            "Reserva da biblioteca confirmada para quarta 15:30. To keep the desk, open the page that copies Virtual and type the campus login. Reply only if you need to cancel after that.",
            "phish",
            SRC_PHISH_LOOKALIKE,
        ),
        (
            "tesouraria@ipb-servicos.com",
            "Tuition receipt",
            "Official reciept for autumn tuition. Keep it. If the amount looks wrong, confirm IBAN and card on this quiet finance portal instead of walking to the office.",
            "phish",
            SRC_PHISH_LOOKALIKE,
        ),
        (
            "propinas@ipb-pagamentos.com",
            "Tuition payment due",
            "Propina de outono a pagar até dia 28. Confirm IBAN on this page when you have time. Finance can transfer faster if you also add the student card number.",
            "phish",
            SRC_PHISH_LOOKALIKE,
        ),
        (
            "bolsas@reitoria-unipb.com",
            "Scholarship shortlist",
            "You were shortlisted. Confirm IBAN on this page that copies the Virtual layout so finance can transfer. Dear student, there is no queue if you do it tonight.",
            "phish",
            SRC_PHISH_LOOKALIKE,
        ),
        (
            "bolsas@unipb.net",
            "Scholarship shortlist",
            "Bolsa: foste pré-selecionado. Confirma os dados nesta página extra. We will not collect the IBAN in person this year. No password is needed today — only on the form.",
            "phish",
            SRC_PHISH_LOOKALIKE,
        ),
        (
            "estagios@ipb-servicos.com",
            "Supervisor signature needed",
            "Dear student, your supervisor asked me to collect the signed internship form today. Upload it to this portal before 17:00 and sign in with campus credentials.",
            "phish",
            SRC_PHISH_LOOKALIKE,
        ),
        (
            "coordenacao.estagios@estig-virtual.net",
            "Internship form",
            "Falta a siganture do supervisor no estágio. Podes carregar o scan no portal. Do not bring paper; the reconstructed Virtual is enough.",
            "phish",
            SRC_PHISH_LOOKALIKE,
        ),
        (
            "erasmus@reitoria-unipb.com",
            "Mobility grant reminder",
            "A one-time mobility grant requires your full name, student number and card, on this official-looking form. Whenever you have a spare moment.",
            "phish",
            SRC_PHISH_LOOKALIKE,
        ),
        (
            "erasmus@virtual-ipb.net",
            "Urgent timetable update",
            "Mobility briefing moved. Check Virtual on our mirror. This is not a password reset, but the page still asks you to sign in so we can attach the grant.",
            "phish",
            SRC_PHISH_LOOKALIKE,
        ),
        (
            "moodle@estig-virtual.net",
            "Assignment deadline",
            "IA project deadline is Friday 23:59. If Virtual is slow, submit the zip on this copy of the layout. Teachers asked me to collect your campus login so they can check the rubric.",
            "phish",
            SRC_PHISH_LOOKALIKE,
        ),
        (
            "noreply@virtual-ipb.net",
            "Virtual maintenance",
            "Virtual will be down Sunday. After the window, sign in on this page that copies the Virtual layout. Ignore the real hostname if ours looks cleaner.",
            "phish",
            SRC_PHISH_LOOKALIKE,
        ),
        (
            "sas@ipb-servicos.com",
            "Meal card top-up",
            "SAS meal card: a small top-up is waiting. No payment is required if you first confirm the card on this portal with campus credentials. Then we add 2.99 EUR for you.",
            "phish",
            SRC_PHISH_LOOKALIKE,
        ),
        (
            "cantina@estig-virtual.net",
            "Canteen menu week 43",
            "Ementa da cantina, semana 43. To see allergens, open the Microsoft-styled page and re-authenticate. This notice never looks loud.",
            "phish",
            SRC_PHISH_LOOKALIKE,
        ),
        (
            "exame@estig-virtual.net",
            "Exam room change",
            "Redes exam moved. Confirm you read the lista by entering student number and password on this official-looking sheet. We will not phone you; the form is enough.",
            "phish",
            SRC_PHISH_LOOKALIKE,
        ),
        (
            "qualidade@ipb-servicos.com",
            "Course survey",
            "Please fill the pedagogical survey. It is anonymous after you unlock it with the campus password on this page that copies Virtual.",
            "phish",
            SRC_PHISH_LOOKALIKE,
        ),
        (
            "alumni@unipb.net",
            "Diploma collection",
            "Diploma pronto. A courier can bring it if you pay 2.99 EUR customs and confirm address on our reconstructed secretaria page. Or collect in person after the fee.",
            "phish",
            SRC_PHISH_LOOKALIKE,
        ),
        (
            "desporto@biblioteca-ipb.org",
            "Gym reservation confirmed",
            "Pavilhão slot confirmed Saturday 09:00. Keep it by signing in with campus credentials. No payment is required tonight unless you want a waiver.",
            "phish",
            SRC_PHISH_LOOKALIKE,
        ),
        (
            "residencias@ipb-servicos.com",
            "Residence inspection",
            "Inspeção às residências na quarta. Staff may request your Virtual password at the door or, more calmly, on this form tonight.",
            "phish",
            SRC_PHISH_LOOKALIKE,
        ),
        (
            "biblioteca@estig.ipb-mail.com",
            "Overdue book",
            "O livro de Bases de Dados está atrasado. Fines are paid on an external waiver page if you sign in with your campus credentials. The desk also exists, but this is faster.",
            "phish",
            SRC_PHISH_LOOKALIKE,
        ),
        (
            "wifi@estig-virtual.net",
            "eduroam reminder",
            "Eduroam: click to renew wifi password on this reconstructed guide. Visit no office. Use your campus username and the passowrd you already have.",
            "phish",
            SRC_PHISH_LOOKALIKE,
        ),
        (
            "calendario@office365-ipb.com",
            "Password expiry reminder",
            "After you renew the campus password, Virtual may ask you to sign in again. Use our Microsoft-styled page in this mail, not the bookmark from IT.",
            "phish",
            SRC_PHISH_LOOKALIKE,
        ),
        (
            "secretaria.alunos@unipb.net",
            "Student card reprint",
            "Cartão de estudante danificado? Reprint 8 EUR. Enter card data on this reconstructed library page. Calm process, same fields as Serviços Académicos.",
            "phish",
            SRC_PHISH_LOOKALIKE,
        ),
        (
            "relacoes.internacionais@reitoria-unipb.com",
            "Learning agreement",
            "Learning agreement comments are ready. We do collect the signed internship form on a third-party portal that copies Virtual. Upload before 17:00.",
            "phish",
            SRC_PHISH_LOOKALIKE,
        ),
        (
            "noreply@idp.ipb.help",
            "Password expire",
            "Campus password expire window: 7 days. Reset it here: http://it-helpdesk.net/reset also branded as IPB. English/PT mix for Erasmus inboxes.",
            "phish",
            SRC_PHISH_LOOKALIKE,
        ),
        (
            "noreply@virtual.ipb.com",
            "Library reservation confirmed",
            "Seat in the ESTiG library is confirmed. To activate it, sign in. This message does not ask for a password in the body; the reconstructed library page does.",
            "phish",
            SRC_PHISH_LOOKALIKE,
        ),
        (
            "it@virtual-ipb.net",
            "Urgent: campus password",
            "URGENT — password expires in 24 hours. Type credentials on the page that copies Virtual. Dúvidas: there is no gabinete, only the form.",
            "phish",
            SRC_PHISH_LOOKALIKE,
        ),
        (
            "horarios@ipb-servicos.com",
            "Horário semana 43",
            "O horário de Engenharia Informática mudou outra vez. Vê o Virtual neste domínio. This message does not ask for a password — the mirror login does.",
            "phish",
            SRC_PHISH_LOOKALIKE,
        ),
        # --- Student-looking phish (gmail/outlook/sapo) overlapping group-work language ---
        (
            "marta.alves.estig@gmail.com",
            "Re: group work",
            "I am locked out of Virtual. Send me your login so I can download the same PDF. I'll send the lab report draft after. Do not tell the teacher.",
            "phish",
            SRC_PHISH_LOOKALIKE,
        ),
        (
            "joao.ribeiro@outlook.com",
            "Group work",
            "Can you send the lab report draft to my student mail and also your Virtual password so I can check the rubric? I already 'have' access, just not today.",
            "phish",
            SRC_PHISH_LOOKALIKE,
        ),
        (
            "ana.costa.ipb@gmail.com",
            "Re: group work",
            "Estou locked out of Virtual on the library PC. Can you send the file and your login? Mixed PT/EN sorry. I'll pay for coffee.",
            "phish",
            SRC_PHISH_LOOKALIKE,
        ),
        (
            "pedro.lopes.estig@sapo.pt",
            "Re: group work",
            "Olá, podes mandar o draft do relatório de SO? Use this sapo address. Also send passwords if Virtual asks me for a second account. I will merge tonight.",
            "phish",
            SRC_PHISH_LOOKALIKE,
        ),
        (
            "ines.martins.curso@outlook.com",
            "Urgent timetable update",
            "Did you see the week 43 change? Check Virtual on this link I made. Save me a seat in B201 after you sign in with campus credentials.",
            "phish",
            SRC_PHISH_LOOKALIKE,
        ),
        (
            "ricardo.sousa.biblio@gmail.com",
            "Library reservation confirmed",
            "I booked desk 14 tommorow 10:00. Confirm on this reconstructed library page with your campus login so we share the slot. No payment is required.",
            "phish",
            SRC_PHISH_LOOKALIKE,
        ),
        (
            "sofia.nunes.reset@gmail.com",
            "Password expiry reminder",
            "IT says the campus password expires in 14 days. I used this page that looks like the official IdP bookmark. Paste yours too so we stay in the group.",
            "phish",
            SRC_PHISH_LOOKALIKE,
        ),
        (
            "tiago.ferreira.lab@gmail.com",
            "Lab report",
            "If Virtual is slow, upload on my mirror. Share the login so a colleague can download the rubric. Here's my section on BGP after you sign in.",
            "phish",
            SRC_PHISH_LOOKALIKE,
        ),
        (
            "beatriz.gomes.bolsa@students.ipb.fake",
            "Canteen after IA",
            "Vamos à cantina depois de IA? Eu pago o café. Before that, confirm IBAN on a form that copies Virtual — scholarship shortlist, very calm.",
            "phish",
            SRC_PHISH_LOOKALIKE,
        ),
        (
            "luis.carvalho.estagio@outlook.com",
            "Supervisor signature needed",
            "Professor is busy. Upload the internship form to this portal and sign in. Don't wait at C12. Dear student, 17:00 is the cut-off.",
            "phish",
            SRC_PHISH_LOOKALIKE,
        ),
        (
            "carla.mendes.mail@sapo.pt",
            "Mailbox almost full",
            "My institutional mailbox is 99% full too. Re-authenticate on this Microsoft-styled page I got; it kept incoming mail. Try it, no payment is required.",
            "phish",
            SRC_PHISH_LOOKALIKE,
        ),
        (
            "nuno.almeida.virtual@gmail.com",
            "Re: group work",
            "I am locked out of Virtual at home (password expire). Send me your login so I can download the same PDF. I'll reset later on a random link.",
            "phish",
            SRC_PHISH_LOOKALIKE,
        ),
        (
            "helena.dias.bd@gmail.com",
            "Notes from week 42",
            "Envio as notas de BD if you first open this Drive that demands a campus login. Typos included. Grab the teacher's PDF through me, not Virtual.",
            "phish",
            SRC_PHISH_LOOKALIKE,
        ),
        (
            "miguel.teixeira.quota@outlook.com",
            "Print quota",
            "Library printers ate my quota. There is a waiver if you sign in with campus credentials on this page. I already did; it asked for the passowrd twice.",
            "phish",
            SRC_PHISH_LOOKALIKE,
        ),
        (
            "rita.fonseca.erasmus@gmail.com",
            "Erasmus docs",
            "Need your full name, student number and a card scan on this lookalike form. I will ask for the card scan. Coordinator already 'has' it, supposedly.",
            "phish",
            SRC_PHISH_LOOKALIKE,
        ),
        (
            "andre.pinto.redes@gmail.com",
            "Group work",
            "Zoom at 21:00. If someone mails send me your login, that's me — I need it for Wireshark. Credentials stay 'personal' after you paste them here.",
            "phish",
            SRC_PHISH_LOOKALIKE,
        ),
        (
            "patricia.leal.horario@outlook.com",
            "Horário semana 43",
            "O horário de Engenharia Informática mudou. Vê o Virtual neste .net. This message does not ask for a password in the subject; please still sign in.",
            "phish",
            SRC_PHISH_LOOKALIKE,
        ),
        (
            "bruno.esteves.propina@sapo.pt",
            "Tuition receipt",
            "I went to a site that looks like Tesouraria; confirm IBAN on a page. If an email says go to the finance office in person, ignore it and use my link.",
            "phish",
            SRC_PHISH_LOOKALIKE,
        ),
        (
            "filipa.rocha.sas@gmail.com",
            "Coffee and IBAN question",
            "SAS asked me by mail to confirm IBAN for the grant, not in person. Want to go together after lunch? First paste IBAN on this quiet form. I can pay for coffee.",
            "phish",
            SRC_PHISH_LOOKALIKE,
        ),
        (
            "sergio.matos.ia@gmail.com",
            "Virtual is slow",
            "Virtual está lento. Use a mirror that copies the Virtual layout to upload the zip. I'll pay for coffee if the upload takes your campus password.",
            "phish",
            SRC_PHISH_LOOKALIKE,
        ),
        (
            "daniela.vieira.idp@outlook.com",
            "Password expire",
            "Got a mail — campus password expire in 14 days. I used a link, not the bookmark. Forward me your passowrd if the IdP looks the same as ours.",
            "phish",
            SRC_PHISH_LOOKALIKE,
        ),
        (
            "hugo.batista.so@gmail.com",
            "Lab pairs",
            "Need a pair for the Friday SO lab. Shall we meet at the canteen first? Share credentials on this note so I can book the USB image on Virtual.",
            "phish",
            SRC_PHISH_LOOKALIKE,
        ),
        (
            "vera.lopes.biblio@gmail.com",
            "Library reservation confirmed",
            "Biblioteca booked me for 16:00. They asked me to sign in again by mail — here's the reconstructed page. Reply only if you need to swap after logging in.",
            "phish",
            SRC_PHISH_LOOKALIKE,
        ),
        (
            "paulo.correia.drive@outlook.com",
            "Re: group work",
            "Mandaste o draft? Use Drive links that demand a campus login. I can pay for coffee when we print. Send passwords if the link stalls.",
            "phish",
            SRC_PHISH_LOOKALIKE,
        ),
        (
            "catarina.silva.bolsa@gmail.com",
            "Scholarship shortlist",
            "I was shortlisted too. Confirm IBAN on a page that copies the Virtual layout. They're not doing IBAN in the office this week, despite rumours.",
            "phish",
            SRC_PHISH_LOOKALIKE,
        ),
        (
            "diogo.ramos.cantina@sapo.pt",
            "Weekend plans",
            "Canteen Friday, then library desk 14. Reserve through this unofficial library mail flow. No payment is required for the seat after you enter the campus password.",
            "phish",
            SRC_PHISH_LOOKALIKE,
        ),
        (
            "leonor.pacheco.slides@gmail.com",
            "Urgent: slides",
            "URGENT — professor posted slides. Grab them with your account on my copy of Virtual. I will ask you to send the password because I'm locked on this café wifi.",
            "phish",
            SRC_PHISH_LOOKALIKE,
        ),
        (
            "felipe.antunes.portal@gmail.com",
            "Internship form",
            "Supervisor signature needed. Use the upload portal some of us got in a lookalike mail. Dear student, wait at C12 only after you typed credentials.",
            "phish",
            SRC_PHISH_LOOKALIKE,
        ),
        (
            "mariana.cruz.outlook@gmail.com",
            "Mailbox almost full",
            "Aviso: mailbox institucional is 99% full. Cleaning? Re-authenticate on this Microsoft-styled page, not on virtual.ipb.pt if it asks.",
            "phish",
            SRC_PHISH_LOOKALIKE,
        ),
        (
            "goncalo.freitas.curso@outlook.com",
            "Timetable change week 42",
            "SO replacement Friday 14:00. Caro aluno mails from this .net domain asking for student number and card are the course director, trust me. Check Virtual here.",
            "phish",
            SRC_PHISH_LOOKALIKE,
        ),
        (
            "adriana.moreira.lab@gmail.com",
            "Group work",
            "Podes enviar o lab report draft e as credentials? English comments are fine. I'll put the bibtex in over the weekend on a page that copies Virtual.",
            "phish",
            SRC_PHISH_LOOKALIKE,
        ),
        (
            "rafael.neves.github@gmail.com",
            "Security alert",
            "GitHub mailed me about an SSH key. To be sure, send the campus password so I can compare. If a GitHub mail asks for IPB login, that's this one.",
            "phish",
            SRC_PHISH_LOOKALIKE,
        ),
        (
            "teresa.barros.dhl@sapo.pt",
            "Exam room change",
            "Redes exam is B203. A DHL parcel is holding our exam papers — pay 2.99 EUR customs now or the parcel is returned. Confirm address and student card.",
            "phish",
            SRC_PHISH_LOOKALIKE,
        ),
        (
            "ivo.campos.lookalike@gmail.com",
            "Password expiry reminder",
            "IT: campus password expires in 14 days. Change it on estig-virtual.net. A calmer mail from the real IdP is the fake one, according to this text.",
            "phish",
            SRC_PHISH_LOOKALIKE,
        ),
        (
            "sandra.mota.login@outlook.com",
            "Re: group work",
            "I'm still locked out. Sending nothing until you mail me your login. Thanks in advance for mailing me your login earlier? Please do it now.",
            "phish",
            SRC_PHISH_LOOKALIKE,
        ),
        (
            "helder.guerra.tesouraria@gmail.com",
            "Propina",
            "Tuition receipt is on this portal, not paper at Tesouraria. Keep it. If the amount looks wrong, do not go to the finance office in person — enter the card here.",
            "phish",
            SRC_PHISH_LOOKALIKE,
        ),
        (
            "claudia.faria.ia@gmail.com",
            "Library reservation confirmed",
            "Seat confirmed for tonight 21:00. No payment is required. A waiver page wants campus credentials; that's the intended next step, not a skip.",
            "phish",
            SRC_PHISH_LOOKALIKE,
        ),
        (
            "eduardo.lobo.papel@gmail.com",
            "Weekend plans",
            "After the networks lab, canteen, then the internship form. Supervisor signature needed on the portal, not paper. I can pay for coffee after you upload.",
            "phish",
            SRC_PHISH_LOOKALIKE,
        ),
        (
            "jessica.tavares.schedulle@gmail.com",
            "Urgent timetable update",
            "Week 43: I already saw a .net mail. Check Virtual there. Slight typo ('schedulle') is fine. Sign in with campus credentials so I know you read it.",
            "phish",
            SRC_PHISH_LOOKALIKE,
        ),
        (
            "marco.vieira.iban@outlook.com",
            "Bolsa",
            "Scholarship shortlist: they want IBAN on a page that copies the Virtual layout. You were shortlisted too, right? Don't confirm IBAN at the desk.",
            "phish",
            SRC_PHISH_LOOKALIKE,
        ),
        (
            "bianca.soriano.lab@sapo.pt",
            "Group work",
            "Draft in attachment after you share credentials. Mixed PT/EN comments because I'm tired. Do share credentials. See you in Lab Redes on the reconstructed page.",
            "phish",
            SRC_PHISH_LOOKALIKE,
        ),
        (
            "afonso.reis.quota@gmail.com",
            "Mailbox quota",
            "IT said mailbox almost full — they will ask you to re-authenticate on a Microsoft-styled page to keep incoming mail. I forwarded the reconstructed one.",
            "phish",
            SRC_PHISH_LOOKALIKE,
        ),
        (
            "lucia.henriques.propina@gmail.com",
            "Canteen Friday",
            "Shall we meet at the canteen on Friday after the networks lab? I can pay for coffee. Bring the tuition reciept by pasting card data on this form, not Tesouraria.",
            "phish",
            SRC_PHISH_LOOKALIKE,
        ),
        # --- Conventional phish (still unique bodies; some reused subjects for overlap) ---
        (
            "alerts@paypa1.com",
            "Urgent account hold",
            "Your account will be closed in 2 hours. Open http://paypa1.com/login and send the password. Campus Virtual users should do the same with the IPB login.",
            "phish",
            SRC_PHISH_CONV,
        ),
        (
            "support@paypa1.com",
            "Tuition payment due",
            "PayPal plus propina: confirm IBAN and the campus password on this hold page. If the amount looks wrong, do not go to the finance office in person.",
            "phish",
            SRC_PHISH_CONV,
        ),
        (
            "customs@dhl-fees.xyz",
            "Parcel waiting",
            "Pay 2.99 EUR customs now or the parcel is returned. Click the link and enter your card. Subject looks like a library reservation but it is a parcel.",
            "phish",
            SRC_PHISH_CONV,
        ),
        (
            "onhold@dhl-fees.xyz",
            "Library reservation confirmed",
            "DHL could not leave a book at ESTiG library desk 14. Pay 2.99 EUR and sign in with campus credentials. No payment is required if you only send the password.",
            "phish",
            SRC_PHISH_CONV,
        ),
        (
            "reset@it-helpdesk.net",
            "Password expire",
            "Your campus password expires today. Reset it here: http://it-helpdesk.net/reset and also mail us the old passowrd. Urgent timetable-style wording, different host.",
            "phish",
            SRC_PHISH_CONV,
        ),
        (
            "tickets@it-helpdesk.net",
            "Mailbox almost full",
            "Mailbox 99% full. Reset it here: http://it-helpdesk.net/reset then re-authenticate. This message does not ask for a password — except on that URL.",
            "phish",
            SRC_PHISH_CONV,
        ),
        (
            "winner@prize-now.top",
            "You won 5000 EUR",
            "Send IBAN and a copy of your ID to claim the lottery prize today. Student number from IPB helps. You were shortlisted, dear student.",
            "phish",
            SRC_PHISH_CONV,
        ),
        (
            "grants@prize-now.top",
            "Scholarship shortlist",
            "Lottery plus bolsa: you won 5000 EUR and were shortlisted. Confirm IBAN on this page that copies the Virtual layout so finance can transfer the prize.",
            "phish",
            SRC_PHISH_CONV,
        ),
        (
            "ops@ups-track.co",
            "Delivery failed",
            "We could not deliver. Confirm address and pay the second-attempt fee. Internship form inside the parcel — supervisor signature needed after you pay.",
            "phish",
            SRC_PHISH_CONV,
        ),
        (
            "retry@ups-track.co",
            "Diploma collection",
            "UPS holds your diploma. Confirm address, student card and campus password. Or the parcel is returned tommorow. I can pay for coffee is not an option here.",
            "phish",
            SRC_PHISH_CONV,
        ),
        (
            "billing@net-invoice.top",
            "Tuition receipt",
            "Official reciept attached after you enter card and IBAN. Keep it. If the amount looks wrong, still pay 2.99 EUR customs-style processing.",
            "phish",
            SRC_PHISH_CONV,
        ),
        (
            "wifi@it-helpdesk.net",
            "eduroam reminder",
            "Click to renew wifi. Send the password. Check Virtual after. This is the same sentence students hear from IT, on the wrong host.",
            "phish",
            SRC_PHISH_CONV,
        ),
        (
            "cast@prize-now.top",
            "Weekend plans",
            "Shall we meet at the canteen on Friday after the networks lab? First send IBAN and a copy of your ID to claim 5000 EUR. I can pay for coffee from the prize.",
            "phish",
            SRC_PHISH_CONV,
        ),
        (
            "office@paypa1.com",
            "Supervisor signature needed",
            "PayPal needs the signed internship form. Upload and send the password. Deadline 17:00. Dear student, account on hold otherwise.",
            "phish",
            SRC_PHISH_CONV,
        ),
        (
            "track@dhl-fees.xyz",
            "Urgent timetable update",
            "Timetable PDF is in a DHL packet. Pay 2.99 EUR or week 43 stays wrong. Click the link and enter your card, then check Virtual.",
            "phish",
            SRC_PHISH_CONV,
        ),
        (
            "sec@paypa1.com",
            "Security alert",
            "A new public SSH key was added — also your PayPal will close in 2 hours. Open http://paypa1.com/login. GitHub will not ask; we will, for the campus password too.",
            "phish",
            SRC_PHISH_CONV,
        ),
        (
            "late@ups-track.co",
            "Overdue book",
            "Library book returned via UPS. Pay the second-attempt fee and sign in with campus credentials on the waiver. O livro de Bases de Dados está atrasado 3 days.",
            "phish",
            SRC_PHISH_CONV,
        ),
        (
            "full@it-helpdesk.net",
            "Mailbox quota",
            "Quota above 90%. Reset it here: http://it-helpdesk.net/reset. Limpa a pasta by giving us the password. No payment is required.",
            "phish",
            SRC_PHISH_CONV,
        ),
        (
            "atm@prize-now.top",
            "Tuition payment due",
            "Propina plus lottery. Confirm IBAN on this page. Paga no ATM is slower than sending the card now. You won 5000 EUR if you hurry.",
            "phish",
            SRC_PHISH_CONV,
        ),
        (
            "room@dhl-fees.xyz",
            "Exam room change",
            "Redes exam papers in customs. Pay 2.99 EUR now or the parcel is returned and you sit in the wrong room. Click the link and enter your card. Lista afixada after payment.",
            "phish",
            SRC_PHISH_CONV,
        ),
        (
            "gym@ups-track.co",
            "Gym reservation confirmed",
            "Pavilhão slot in a parcel. We could not deliver. Confirm address and pay the second-attempt fee. No payment is required if you instead send the campus password.",
            "phish",
            SRC_PHISH_CONV,
        ),
        (
            "survey@it-helpdesk.net",
            "Course survey",
            "Unlock the official pedagogical survey with your password at http://it-helpdesk.net/reset. It is anonymous after we have the login. Nobody else needs it.",
            "phish",
            SRC_PHISH_CONV,
        ),
        (
            "card@paypa1.com",
            "Student card reprint",
            "Reprint 8 EUR via PayPal lookalike. Enter card data. Your account will be closed in 2 hours if you use Tesouraria instead. Open http://paypa1.com/login.",
            "phish",
            SRC_PHISH_CONV,
        ),
        (
            "la@prize-now.top",
            "Learning agreement",
            "Learning agreement prize: send IBAN and a copy of your ID. Print, sign, then upload to us. We collect the signed internship form on this lottery page.",
            "phish",
            SRC_PHISH_CONV,
        ),
        (
            "menu@dhl-fees.xyz",
            "Canteen menu week 43",
            "Ementa da cantina is in customs. Pay 2.99 EUR. This notice never asks for a password unless you want the soup list. Click the link and enter your card.",
            "phish",
            SRC_PHISH_CONV,
        ),
        (
            "maint@it-helpdesk.net",
            "Virtual maintenance",
            "Virtual down Sunday. Sign in on http://it-helpdesk.net/reset after. Ignore mails from virtual.ipb.pt. Reset it here and send the password.",
            "phish",
            SRC_PHISH_CONV,
        ),
        (
            "pair@ups-track.co",
            "Lab pairs",
            "USB image for SO lab is with UPS. We could not deliver. Confirm address and pay the second-attempt fee. Shall we meet at the canteen after you pay?",
            "phish",
            SRC_PHISH_CONV,
        ),
        (
            "notes@paypa1.com",
            "Notes from week 42",
            "BD notes after you open http://paypa1.com/login. Typos included. Your account will be closed in 2 hours. Send the password. Grab the teacher's PDF from us.",
            "phish",
            SRC_PHISH_CONV,
        ),
        (
            "inspect@dhl-fees.xyz",
            "Residence inspection",
            "Staff plus DHL tonight. Pay 2.99 EUR customs for the inspection form. Virtual password at the door or on the link. Click the link and enter your card.",
            "phish",
            SRC_PHISH_CONV,
        ),
        (
            "deadline@it-helpdesk.net",
            "Assignment deadline",
            "IA zip due Friday. Submit at http://it-helpdesk.net/reset. Teachers will ask you to send the campus login so they can check the rubric. Reset it here.",
            "phish",
            SRC_PHISH_CONV,
        ),
    ]

    rows: list[dict] = []
    ham_n = conv_n = ai_n = 0
    bodies: set[str] = set()
    for sender, subject, body, label, source in raw:
        if body in bodies:
            raise ValueError(f"duplicate body: {body[:80]!r}")
        bodies.add(body)
        if label == "ham":
            ham_n += 1
            rid = f"ham-{ham_n}"
        elif source == SRC_PHISH_CONV:
            conv_n += 1
            rid = f"conv-{conv_n}"
        else:
            ai_n += 1
            rid = f"ai-{ai_n}"
        rows.append(
            {
                "id": rid,
                "sender": sender,
                "subject": subject,
                "body": body,
                "label": label,
                "source": source,
            }
        )
    return rows


def pick_review_rows(rows: list[dict], k: int = 20) -> list[dict]:
    """Twenty rows I sampled for manual review: mix ham/phish and official/student/lookalike/conventional."""
    groups = [
        [r for r in rows if r["label"] == "ham" and r["source"] == SRC_HAM_OFFICIAL],
        [r for r in rows if r["label"] == "ham" and r["source"] == SRC_HAM_STUDENT],
        [r for r in rows if r["source"] == SRC_PHISH_LOOKALIKE],
        [r for r in rows if r["source"] == SRC_PHISH_CONV],
    ]

    def spread(items: list[dict], n: int) -> list[dict]:
        if not items:
            return []
        if len(items) <= n:
            return items[:]
        step = len(items) / n
        return [items[int(i * step)] for i in range(n)]

    per = [5, 5, 6, 4]
    selected: list[dict] = []
    seen: set[str] = set()
    for grp, n in zip(groups, per):
        for r in spread(grp, n):
            if r["id"] not in seen:
                seen.add(r["id"])
                selected.append(r)
    if len(selected) < k:
        for r in rows:
            if r["id"] not in seen:
                selected.append(r)
                seen.add(r["id"])
            if len(selected) >= k:
                break
    return selected[:k]


def make_texts(rows, with_sender):
    if with_sender:
        return [f"{r['subject']}\n{r['body']}\nFrom:{r['sender']}" for r in rows]
    return [f"{r['subject']}\n{r['body']}" for r in rows]


def make_lr():
    return Pipeline(
        [
            ("tfidf", TfidfVectorizer(ngram_range=(1, 2), min_df=2)),
            ("lr", LogisticRegression(max_iter=400)),
        ]
    )


def make_baseline():
    return DummyClassifier(strategy="constant", constant=1)


def holdout(texts, y, model):
    idx = list(range(len(texts)))
    x_tr, x_te, y_tr, y_te, _i_tr, i_te = train_test_split(
        texts, y, idx, test_size=0.30, random_state=SEED, stratify=y
    )
    model.fit(x_tr, y_tr)
    pred = model.predict(x_te)
    proba = model.predict_proba(x_te)[:, 1]
    tn, fp, fn, tp = confusion_matrix(y_te, pred, labels=[0, 1]).ravel()
    metrics = {
        "n_train": len(x_tr),
        "n_test": len(x_te),
        "accuracy": float(accuracy_score(y_te, pred)),
        "precision": float(precision_score(y_te, pred, zero_division=0)),
        "recall": float(recall_score(y_te, pred)),
        "f1": float(f1_score(y_te, pred)),
        "auc": float(roc_auc_score(y_te, proba)),
        "confusion": {"tn": int(tn), "fp": int(fp), "fn": int(fn), "tp": int(tp)},
    }
    return metrics, (i_te, y_te, pred, proba)


def cross_val(texts, y, model):
    res = cross_validate(
        model,
        texts,
        y,
        cv=StratifiedKFold(n_splits=5, shuffle=True, random_state=SEED),
        scoring=["accuracy", "precision", "recall", "f1", "roc_auc"],
    )
    return {
        k[len("test_") :]: {"mean": float(v.mean()), "std": float(v.std())}
        for k, v in res.items()
        if k.startswith("test_")
    }


def sender_domain(row):
    return row["sender"].split("@")[-1].strip().lower()


def cross_val_by_domain(texts, y, groups, model):
    """5-fold CV in which no sender domain appears in both the training and the test fold."""
    res = cross_validate(
        model,
        texts,
        y,
        groups=groups,
        cv=StratifiedGroupKFold(n_splits=5, shuffle=True, random_state=SEED),
        scoring=["accuracy", "precision", "recall", "f1", "roc_auc"],
    )
    return {
        k[len("test_"):]: {"mean": float(v.mean()), "std": float(v.std())}
        for k, v in res.items()
        if k.startswith("test_")
    }


def provenance():
    import sklearn

    try:
        commit = subprocess.check_output(
            ["git", "rev-parse", "--short", "HEAD"], cwd=str(HERE), text=True
        ).strip()
    except Exception:
        commit = "unknown"
    return {
        "git_commit": commit,
        "python_version": platform.python_version(),
        "sklearn_version": sklearn.__version__,
    }


def main():
    rows = build_corpus()
    (HERE / "corpus.jsonl").write_text("\n".join(json.dumps(r) for r in rows) + "\n")
    y = [0 if r["label"] == "ham" else 1 for r in rows]
    wording = make_texts(rows, with_sender=False)
    with_sender = make_texts(rows, with_sender=True)
    groups = [sender_domain(r) for r in rows]

    wording_holdout, (i_te, y_te, pred, proba) = holdout(wording, y, make_lr())
    sender_holdout, _ = holdout(with_sender, y, make_lr())
    base_holdout, _ = holdout(wording, y, make_baseline())

    metrics = {
        "n_total": len(rows),
        "n_ham": y.count(0),
        "n_phish": y.count(1),
        "seed": SEED,
        "source": "computed",
        "model": "TfidfVectorizer(1-2gram, min_df=2) + LogisticRegression(max_iter=400)",
        "label_note": (
            "Labels are the corpus labels shipped in corpus.jsonl (author-written, reconstructed "
            "teaching data), not a mailbox harvest and not Gemini-as-judge. "
            "wording_only = subject + body (the body can still contain link domains). "
            "with_sender = subject + body + From address. "
            "baseline_all_phish = always predicts phish."
        ),
        "holdout_70_30": {
            "wording_only": wording_holdout,
            "with_sender": sender_holdout,
            "baseline_all_phish": base_holdout,
        },
        "cv_5fold_grouped_by_sender_domain": {
            "note": "StratifiedGroupKFold(5): no sender domain is shared between training and test folds.",
            "n_domains": len(set(groups)),
            "wording_only": cross_val_by_domain(wording, y, groups, make_lr()),
            "with_sender": cross_val_by_domain(with_sender, y, groups, make_lr()),
            "baseline_all_phish": cross_val_by_domain(wording, y, groups, make_baseline()),
        },
        "provenance": provenance(),
        "cv_5fold": {
            "wording_only": cross_val(wording, y, make_lr()),
            "with_sender": cross_val(with_sender, y, make_lr()),
            "baseline_all_phish": cross_val(wording, y, make_baseline()),
        },
    }
    (OUT / "phishing_metrics.json").write_text(json.dumps(metrics, indent=2))

    with (OUT / "predictions.csv").open("w", newline="") as f:
        w = csv.DictWriter(f, fieldnames=["id", "label", "pred", "proba", "subject"])
        w.writeheader()
        for idx, yp, pr in zip(i_te, pred, proba):
            w.writerow(
                {
                    "id": rows[idx]["id"],
                    "label": rows[idx]["label"],
                    "pred": "phish" if yp == 1 else "ham",
                    "proba": f"{pr:.4f}",
                    "subject": rows[idx]["subject"],
                }
            )
    # I do not overwrite MANUAL_REVIEW.csv on rerun.
    print(json.dumps({k: metrics[k] for k in ("holdout_70_30", "cv_5fold", "cv_5fold_grouped_by_sender_domain")}, indent=2))
    print("wrote", OUT / "phishing_metrics.json")


if __name__ == "__main__":
    main()
