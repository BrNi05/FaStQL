# FaStQL

## Introduction

FaStQL is a wrapper for the SQL command-line interface (`sqlcl`), designed to make working with it faster and more convenient.

Its development is primarily aligned with the content and assignments of the [Adatbázisok](https://www.db.bme.hu/adatbazisok/) course at BME-VIK.

---

## Development

You can track the ongoing development [here](https://github.com/users/BrNi05/projects/4/views/1). If you encounter a bug or have a feature request, feel free to [open a ticket](https://github.com/BrNi05/FaStQL/issues).

If you’d like to get involved, you can [contribute](https://github.com/BrNi05/FaStQL/blob/main/.github/CONTRIBUTING.md) to the FaStQL project.

You can also check out the [Docker Hub repo](https://hub.docker.com/repository/docker/brni05/fastql/).

> [!IMPORTANT]
> On Windows, `node-pty` requires the Spectre Mitigations version of some build tools and libraries. More information can be found [here](https://learn.microsoft.com/en-us/cpp/build/reference/qspectre?view=msvc-160).

---

## How to set up

FaStQL is currently distributed exclusively as a [Docker image](https://hub.docker.com/repository/docker/brni05/fastql/general), thus you will need to [install Docker](https://docs.docker.com/engine/install/) on your system.

FaStQL supports all platforms that are compatible with Docker.

> [!TIP]
> Using Docker Desktop can simplify things on all platforms, even on Linux, where many users prefer the CLI.

**Create a folder, then create the following files:**

**docker-compose.yaml**

```Dockerfile
services:
  fastql:
    container_name: FaStQL
    image: brni05/fastql:latest
    restart: unless-stopped
    env_file:
      - .env
    network_mode: "bridge"
    ports:
      - "${PORT}:${PORT}"
    logging:
      driver: "json-file"
      options:
        max-size: "10m"
        max-file: "5"
    volumes:
      - ./output:/fastql/output
```

**.env**

```dotenv
# The path to the installed sqlcl executable
# The Docker image has sqlcl bundled at /fastql/external/sqlcl/bin/sql
SQLCL_PATH=/fastql/external/sqlcl/bin/sql

# The port on which the server (and the GUI) will be accessible
PORT=3333
```

Open a terminal in the folder you just created (this should be your current working directory).

To start FaStQL: `docker compose up -d`.

> [!TIP]
> The FaStQL image is relatively large due to technical constraints, so downloading it may take a bit longer than usual. The compressed image is about 370 MB, and it expands to 1.3 GB once extracted.

> [!TIP]
> You can view container logs using Docker Desktop.

To stop FaStQL: `docker compose down`.

---

## How to use

In your browser, visit: `http://localhost:3333/`. The FaStQL GUI will appear.

> [!TIP]
> You can use F11 to toggle fullscreen mode, but only when the terminal is not focused.

It will take a few seconds for `sqlcl` to start, but you should see the default startup output in a few seconds.

> [!IMPORTANT]
> Since FaStQL runs in a Docker container, a volume mount is needed to exchange data between the host and the container, which is done in the compose config.
>
> As soon as you start the container, a folder named `output` will appear in the PWD.
>
> The same folder exists in the container as well: `/fastql/output`.
>
> To avoid data loss, FaStQL always prepends `output/` to paths you input using the GUI.

**Terminal:**

- A psueod-terminal is rendered in the center of the screen with `sqlcl` already running.
- You can open multiple FaStQL instances in separate windows, each providing a fresh terminal.

**Top toolbar:**

- **CONNECT**

  - For the first time, enter your username and password.
    - FaStQL will remember your credentials for future use - just press Enter next time to auto-fill the fields.
    - The connection string format is: `uname/psw@//rapid.eik.bme.hu:1521/szglab`.
  - Press CONNECT.

- **RUN**

  - Enter the path to the script you want to run, relative to the host `output` folder.
  - If you leave the field empty, the placeholder path will be used by default (with `output/` prepended).
  - You can omit the extension (`.sql`), FaStQL will append it.

- **SPOOL**

  - Spool: ✔ / ✖:
    - ✖: spooling is currently disabled.
    - Enter the path to the spool file you want to use, relative to the `output` folder. If the path (and/or file) does not exists, FaStQL will create it.
    - If you leave the field empty, the placeholder path will be used by default.

    - ✔: spooling is currently enabled - just press the button to disable it.

- **COMPOSER**

  - Use Composer to create and manage multi-line SQL commands. You can save them, load them, and execute them.

- **SCRIPTER**

  - A [utility](https://db.bme.hu/files/szoftlab5/sql/oracle/sql123-beadando-generator.html) provided by db.bme.hu for creating SQL scripts required for submission on SQL1-2-3 labs.

- **CLEAR**

  - This button clears the console.

> [!TIP]
> Use `Ctrl + C` and `Ctrl + Shift + V` key combinations or the right-click menu to perform copy and paste actions. `Ctrl + V` is buggy (and does not paste) - avoid using it.
>
> `Ctrl + Shift + C` also triggers a copy action, but opens the browser inspector as well.

**Bottom toolbar:**

The bottom toolbar serves as a help menu, providing quick access to course materials and official sites for reference.

> [!TIP]
> To update FaStQL: `docker pull brni05/fastql:latest`, then restart the container.

---

## Technical details

- The FaStQL image includes `sqlcl` (version 24.3.1) bundled within it and does not rely on any `sqlcl` installations on the host. This is one reason for the big image size.

- FaStQL supports unlimited sessions, allowing you to open multiple windows that connect to the same database simultaneously.

- FastQL is fully cross-platform.

---

## Legal

`sqlcl` is licensed under the Oracle Free Use Terms and Conditions.
The full text of this license is published [here](https://www.oracle.com/downloads/licenses/oracle-free-license.html).

The SQL script generation functionality (`SCRIPTER`) utilizes resources provided by [db.bme.hu](db.bme.hu). The FaStQL project claims no ownership or credit.

FaStQL (excluding `sqlcl`) is licensed under the [Apache 2.0 License](https://github.com/BrNi05/FaStQL/blob/main/LICENSE).
