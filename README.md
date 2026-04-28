# Projeto: Triagem da Síndrome do X Frágil (SXF)

## 🗄️ Guia de Conexão com o Banco de Dados (PostgreSQL / Supabase)

A infraestrutura do banco de dados já está 100% configurada na nuvem. As tabelas obrigatórias (`pacientes`, `sintomas`, `avaliacoes` e `usuarios`) e os pesos da fórmula clínica baseados no artigo científico já estão cadastrados.

Para o  **Back-end** integrar a lógica de cálculo de Score com o banco, baixem a seguinte biblioteca:

### Instalação de Requisitos
Para que o Python consiga ler a URL segura e executar comandos SQL, instalem as bibliotecas no ambiente de vocês:

```bash
pip install python-dotenv sqlalchemy psycopg2-binary
