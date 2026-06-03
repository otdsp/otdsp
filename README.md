# OTDSP - Observatório de Transformação Digital do Estado de São Paulo

Este é o portal oficial do **Observatório de Transformação Digital do Estado de São Paulo (OTDSP)**, desenvolvido em cooperação com a **Inova USP** e o **IEA**. O objetivo da plataforma é conectar inovação, dados e desenvolvimento para apoiar e impulsionar o avanço tecnológico dos municípios paulistas.

---

## Tecnologias Utilizadas

O projeto foi construído utilizando o ecossistema moderno do React e Next.js:

*   **Framework:** [Next.js 15](https://nextjs.org/) (App Router)
*   **Estilização:** [Tailwind CSS](https://tailwindcss.com/) (Interface limpa, moderna e responsiva)
*   **Animações:** [Framer Motion / Motion](https://motion.dev/) (Efeitos de warping em backgrounds, carrosséis fluidos e transições de menus)
*   **Ícones:** [Lucide React](https://lucide.dev/)
*   **Backend & Autenticação:** [Supabase](https://supabase.com/) (Controle de usuários, perfis e níveis de acesso como *Staff*)

---

## Funcionalidades Principais

*   **Menu Dinâmico com Níveis de Acesso:** Exibe opções personalizadas de acordo com o estado de autenticação do usuário. Membros da equipe (*Staff*) têm acesso exclusivo à aba de **Indicadores**.
*   **Áreas de Atuação & Transversais:** Páginas estruturadas para expor iniciativas em Saúde, Educação (Laboratórios STEAM/Maker), Segurança (ABESE Labs) e Meio Ambiente.
*   **Carrossel de Casos de Sucesso:** Exibição interativa e animada com os principais impactos gerados (Ex: Projeto INSPIRE e EDUCA + INOVAUSP).

---

## Como Rodar o Projeto Localmente

Siga os passos abaixo para configurar e executar o projeto na sua máquina:

### 1. Pré-requisitos
Certifique-se de ter o [Node.js](https://nodejs.org/) instalado (versão 18 ou superior recomendada).

### 2. Clonar ou Acessar a Pasta
No seu terminal, navegue até a pasta do projeto:
```bash
cd caminho/para/o/projeto/otdsp
```

3. Instalar as Dependências
Instale todos os pacotes necessários listados no package.json:

```bash
npm install
```

4. Configurar as Variáveis de Ambiente
Crie um arquivo chamado .env.local na raiz do projeto (caso já não exista) e configure as credenciais do seu projeto Supabase e o caminho base do roteador, se necessário:

```bash
NEXT_PUBLIC_SUPABASE_URL=sua_url_do_supabase
NEXT_PUBLIC_SUPABASE_ANON_KEY=sua_chave_anon_do_supabase
```

5. Iniciar o Servidor de Desenvolvimento
Rode o comando para subir o projeto localmente:

```bash
npm run dev
```
Abra http://localhost:3000 no seu navegador para ver o resultado.