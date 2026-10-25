# Project report (UPB official template)

English report for Rinor Basholli (69492), Informatics Engineering, ESTiG / Instituto Politécnico de Bragança.

This folder **is** the official `project-report` template from Virtual. The hard-disk example chapters were replaced by the thesis chapters. Logos and `sty/project-report.sty` are the official files.

## Overleaf

1. Overleaf → New project → Upload project.
2. Upload `InsightFlow-report-overleaf.zip` (this `report/` folder).
3. Set the main document to `main.tex`.
4. Menu → Compiler: pdfLaTeX. Enable **shell escape** if minted fails (Overleaf: Menu → Compiler → TeX Live, or add a `latexmkrc` with `$pdflatex = 'pdflatex -shell-escape %O %S';`).
5. Recompile. Do not paste the template’s sample `cap1` hard-disk text back in.

## Compile

The template uses `minted`, so compilation needs shell escape and `pygmentize`.

```sh
cd report
docker run -i --rm --name latex -v "$PWD":/usr/src/app -w /usr/src/app \
  registry.gitlab.com/islandoftex/images/texlive:latest \
  pdflatex -shell-escape --output-directory=output main

docker run -i --rm --name latex -v "$PWD":/usr/src/app -w /usr/src/app \
  registry.gitlab.com/islandoftex/images/texlive:latest \
  bibtex output/main

docker run -i --rm --name latex -v "$PWD":/usr/src/app -w /usr/src/app \
  registry.gitlab.com/islandoftex/images/texlive:latest \
  pdflatex -shell-escape --output-directory=output main

docker run -i --rm --name latex -v "$PWD":/usr/src/app -w /usr/src/app \
  registry.gitlab.com/islandoftex/images/texlive:latest \
  pdflatex -shell-escape --output-directory=output main
```

If a local TeX Live is installed:

```sh
pdflatex -shell-escape --output-directory=output main
bibtex output/main
pdflatex -shell-escape --output-directory=output main
pdflatex -shell-escape --output-directory=output main
```

## Chapter files

- `cap1.tex` Introduction
- `cap2.tex` State of the art
- `cap3.tex` Requirements and use cases
- `cap4.tex` Architecture
- `cap5.tex` Implementation
- `cap6.tex` Evaluation
- `cap7.tex` Discussion
- `cap8.tex` Conclusion and future work
- `apendiceA.tex` AI declaration
- `apendiceB.tex` How to run the evaluation scripts
