# Regras de Negócio e Algoritmo de Triagem - Síndrome do X Frágil (SXF)

Este documento define estritamente o modelo matemático e os pesos clínicos (derivados do algoritmo de Random Forest) que o Backend deve utilizar para calcular a probabilidade de um paciente possuir a Síndrome do X Frágil (SXF). 

A IA (Tech Lead) e os desenvolvedores devem tratar esses valores como **imutáveis** no código.

## 1. A Fórmula de Cálculo (Score)

[cite_start]O núcleo do sistema de triagem baseia-se na conversão dos sintomas em variáveis binárias[cite: 609]. O cálculo do score final do paciente é dado pela seguinte fórmula matemática:

[cite_start]$$Score = \sum (Peso_j \times X_{ij})$$ [cite: 162, 610]

Onde:
* [cite_start]$Peso_j$ = O peso estatístico específico do sintoma `j`[cite: 162].
* $X_{ij}$ = Valor binário indicando a presença do sintoma. [cite_start]Assume o valor `1` se o sintoma estiver presente no paciente `i`, e `0` se estiver ausente[cite: 162, 609].

## 2. Parâmetros Decisórios (Limiares / Thresholds)

[cite_start]Para classificar um paciente como "Suspeito" e emitir o encaminhamento automático para exames genéticos confirmatórios (ex: PCR/Southern Blot para o gene FMR1), o `Score` final deve ser comparado ao limiar de corte validado pela curva ROC para garantir 95% de sensibilidade[cite: 604, 605, 613].

* [cite_start]**Sexo Masculino:** Limiar de corte $\ge 0.56$[cite: 212, 604, 613].
* [cite_start]**Sexo Feminino:** Limiar de corte $\ge 0.55$[cite: 215, 604, 613].

[cite_start]Se o `Score` $\ge$ Limiar, o sistema deve alertar a necessidade de testes[cite: 613].

## 3. Tabela de Pesos por Sintoma e Sexo

Os pesos variam de acordo com o sexo biológico do paciente. O backend deve implementar lógicas separadas ou dicionários de pesos distintos dependendo do sexo informado no payload.

### Tabela Masculina (Male Checklist)
| ID Interno (Sugestão) | Sintoma Clínico | Peso ($Peso_j$) |
| :--- | :--- | :--- |
| `intellectual_disability` | Deficiência Intelectual (ID) | [cite_start]0.32 [cite: 340] |
| `elongated_face` | Face alongada, mandíbula proeminente e/ou orelhas de abano | [cite_start]0.29 [cite: 340] |
| `macroorchidism` | Macroorquidismo (Aumento do volume testicular) | [cite_start]0.26 [cite: 340] |
| `joint_hypermobility` | Hiperflexibilidade articular (hipermobilidade) | [cite_start]0.19 [cite: 340] |
| `learning_difficulties` | Dificuldades de aprendizagem | [cite_start]0.18 [cite: 340] |
| `attention_deficit` | Déficit de atenção | [cite_start]0.17 [cite: 340] |
| `repetitive_movements` | Movimentos intencionais, repetitivos e rítmicos | [cite_start]0.17 [cite: 340] |
| `delayed_speech` | Atraso na fala | [cite_start]0.14 [cite: 340] |
| `hyperactivity` | Hiperatividade | [cite_start]0.12 [cite: 340] |
| `avoids_eye_contact` | Evita contato visual | [cite_start]0.06 [cite: 340] |
| `avoids_physical_contact`| Evita contato físico | [cite_start]0.04 [cite: 340] |
| `aggressiveness` | Agressividade | [cite_start]0.01 [cite: 340] |

### Tabela Feminina (Female Checklist)
[cite_start]*(Nota: O sintoma de Macroorquidismo é exclusivo do sexo masculino e não se aplica à triagem feminina [cite: 117, 589]).*

| ID Interno (Sugestão) | Sintoma Clínico | Peso ($Peso_j$) |
| :--- | :--- | :--- |
| `learning_difficulties` | Dificuldades de aprendizagem | [cite_start]0.28 [cite: 344] |
| `intellectual_disability` | Deficiência Intelectual (ID) | [cite_start]0.20 [cite: 344] |
| `attention_deficit` | Déficit de atenção | [cite_start]0.12 [cite: 344] |
| `elongated_face` | Face alongada, mandíbula proeminente e/ou orelhas de abano | [cite_start]0.09 [cite: 344] |
| `avoids_eye_contact` | Evita contato visual | [cite_start]0.08 [cite: 344] |
| `avoids_physical_contact`| Evita contato físico | [cite_start]0.07 [cite: 344] |
| `repetitive_movements` | Movimentos intencionais, repetitivos e rítmicos | [cite_start]0.05 [cite: 344] |
| `hyperactivity` | Hiperatividade | [cite_start]0.04 [cite: 344] |
| `joint_hypermobility` | Hiperflexibilidade articular (hipermobilidade) | [cite_start]0.04 [cite: 344] |
| `aggressiveness` | Agressividade | [cite_start]0.02 [cite: 344] |
| `delayed_speech` | Atraso na fala | [cite_start]0.01 [cite: 344] |

## 4. Diretrizes de Implementação Backend
1. Use tipos flutuantes (Floats/Decimals) apropriados no Python para evitar erros de arredondamento.
2. O payload do frontend deve ser rigorosamente validado (via Pydantic) para aceitar apenas valores booleanos/binários para cada um desses sintomas.