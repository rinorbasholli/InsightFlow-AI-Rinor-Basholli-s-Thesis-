# Project report (UPB official template)

English report for Rinor Basholli (69492), Informatics Engineering, ESTiG / Instituto Politécnico de Bragança.

Language is set with `\reportlanguage{en}` in `main.tex`. Bibliography uses BibTeX `ieeetr` (`\bibliographystyle{ieeetr}\bibliography{refs}`), as required by this official `project-report` template.

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

## Compile note (this machine, 20 Oct 2026)

`docker`, `pdflatex`, `latexmk`, and `tectonic` were not on `PATH`. `/usr/local/texlive` and `/Library/TeX/texbin` were also absent. The PDF was therefore **not** built here. Install TeX Live or Docker and run the commands above.

## Chapter files

- `cap1.tex` Introduction
- `cap2.tex` State of the art
- `cap3.tex` Requirements and use cases
- `cap4.tex` Architecture
- `cap5.tex` Implementation
- `cap6.tex` Evaluation
- `cap7.tex` Discussion
- `cap8.tex` Conclusion and future work
- `apendiceA.tex` AI declaration and TRACE
- `apendiceB.tex` How to run the evaluation scripts
