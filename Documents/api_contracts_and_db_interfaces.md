# Contratos de API e Interfaces de Dados (Backend)

Este documento define os padrões de comunicação entre o Backend, o Frontend e a Camada de Persistência (Banco de Dados).

## 1. Padrões de Comunicação (API)
* **Protocolo:** RESTful API (`/api/v1`)
* **Validação:** Pydantic V2 estrito.

## 2. Padrão Arquitetural de Banco de Dados (CRÍTICO)
O banco de dados do projeto opera sob o padrão de **Active Database** com forte conformidade à LGPD. O Back-end (FastAPI) **NÃO DEVE** realizar criptografia de dados (PGP) nem hashing de senhas. O banco de dados cuida da ofuscação em nível de disco.

**Regras de Interação do Repositório (SQLAlchemy/SQLModel):**
1. **Conexão:** A API web do Back-end deve se conectar ao banco utilizando a role `nivel_1` (permissão transacional).
2. **Uso Exclusivo de Views:** O Back-end NUNCA deve interagir com as tabelas físicas `tb_pacientes` e `tb_avaliacoes`. O Back-end deve fazer `INSERT`, `UPDATE` e `SELECT` APENAS nas Views Lógicas `pacientes` e `avaliacoes`.
3. **Transparência de Criptografia:**
   - O Back-end envia o `nome` do paciente em TEXTO PLANO para a view `pacientes`. Um trigger `INSTEAD OF` no banco fará a criptografia para a tabela física.
   - O Back-end calcula o `score_final` (decimal) e envia para a view `avaliacoes`. O trigger fará o cast e a ofuscação para `BYTEA`.
4. **Hashing de Senha:** A tabela `usuarios` possui uma trigger `trg_hash_senha_usuario()` que converte senhas planas para Bcrypt no `INSERT/UPDATE`. O Back-end apenas envia a senha plana na criação do usuário. (Nota: para o endpoint de Login, o Back-end precisará buscar o hash salvo e comparar, ou utilizar uma função autenticadora no banco).

## 3. Interfaces do Banco de Dados (Repository Pattern)

### 3.1. `IPatientRepository`
* Interage com a View: `pacientes`
* Mapeia as colunas expostas pela view: `id` (int), `nome` (text), `data_nascimento` (date), `sexo` (char).

### 3.2. `IAssessmentRepository`
* Interage com a View: `avaliacoes`
* Mapeia as colunas expostas pela view: `id` (int), `paciente_id` (int), `usuario_id` (int), `data_avaliacao` (timestamp), `score_final` (decimal 5,2).

### 3.3. `IChecklistRepository` (N:M)
* Interage com as tabelas: `sintomas` (Catálogo de Pesos) e `respostas_checklist` (Booleanos).

## 4. Contratos de Dados (Schemas Pydantic)
* **`PatientCreate`**: `nome` (str), `data_nascimento` (date), `sexo` (enum M/F).
* **`SymptomChecklist`**: Contém os booleanos correspondentes à tabela `respostas_checklist`.
* **`AssessmentResponse`**: Retorna o `score_final` e a indicação de encaminhamento médico baseado no limiar.