# FaStQL

## Introduction

FaStQL is a wrapper for the SQL command-line interface (hereafter referred to as `sqcl`), designed to make working with it faster and more convenient.

Its development is primarily aligned with the content and assignments of the [Adatbázisok](https://www.db.bme.hu/adatbazisok/) course at BME-VIK.

---

## Development

You can track the ongoing development [here](https://github.com/users/BrNi05/projects/4/views/1).

If you’d like to get involved, you can also [contribute](https://github.com/BrNi05/FaStQL/blob/main/.github/CONTRIBUTING.md) to the FaStQL project.

You can also check out the [Docker Hub repo](https://hub.docker.com/repository/docker/brni05/fastql/).

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
# The Docker image has the sqlcl bundled in /fastql/external/sqlcl/bin/sql
SQLCL_PATH=/fastql/external/sqlcl/bin/sql

# The port on which the server (and the GUI) will be accessible
PORT=3333
```

Open a terminal in the folder you just created (this should be your current working directory).

To start FaStQL: `docker compose up -d`.

> [!TIP]
> The FaStQL image is relatively large due to technical constraints, so downloading it may take a bit longer than usual.

> [!TIP]
> You can view container logs using Docker Desktop.

To stop FaStQL: `docker compose down`.

---

## How to use

> [!WARNING]
> FaStQL is not tested yet. Use it at your own risk. You can check the currently known bugs [here](https://github.com/BrNi05/FaStQL/issues?q=is%3Aissue%20state%3Aopen%20label%3ABUG).

In your browser, visit: `http://localhost:3333/`. The FaStQL GUI will appear.

It may take a few seconds for `sqlcl` to start, but you should see the default startup output in a few seconds.

> [!IMPORTANT]
> Since FaStQL runs in a Docker container, a volume mount is needed to exchange data between the host and the container, which is done in the compose config.
> 
> As soon as you start the container, a folder named output will appear in the PWD.
> 
> The same folder exists in the container as well.
> 
> To avoid data loss, FaStQL always prepends `output/` to paths you input using the GUI.

**Terminal:**

- A psueod-terminal is rendered in the center of the screen with `sqlcl` already running.
- You can open multiple FaStQL instances in separate windows, each providing a fresh terminal.

**Top toolbar:**

- **Connection**

  - You can connect to a database in multiple ways.
    - Enter a whole connection string, like `uname@//rapid.eik.bme.hu:1521/szglab`.
    - Enter only a username, like `myuname`. FaStQL will expand it like: `myuname@//rapid.eik.bme.hu:1521/szglab`.
    - If you connected to a database before, just press connect, as FaStQL remembers the last connection string.
  
  - Press Connect.

- **Run Script**

  - Enter the path to the script you want to run, relative to the `output` folder.
  - If you leave the field empty, the placeholder path will be used by default.

- **Spool**

  - Spool ON:
    - Enter the path to the spool file you want to use, relative to the `output` folder. If the path does not exists, FaStQL will create it.
    - If you leave the field empty, the placeholder path will be used by default.

  - Spool OFF:
    - Pressing this button will save all output generated since Spool ON was activated to the specified file.
   
- **CLEAR**

  - This button clears the console.

> [!TIP]
> `Ctrl + C` and `Ctrl + V` key combinations do not work (like in most terminals). Use the right-click menu.

---

## Technical details

- The FaStQL image includes `sqlcl` (version 24.3.1) bundled within it and does not rely on any `sqlcl` installations on the host.

- FaStQL supports unlimited sessions, allowing you to open multiple windows that connect to the same database simultaneously.

- On Windows, `node-pty` requires the Spectre Mitigations version of some build tools and libraries. More information can be found [here](https://learn.microsoft.com/en-us/cpp/build/reference/qspectre?view=msvc-160).

---

## Legal

`sqlcl` is licensed under the Oracle Free Use Terms and Conditions.
The full text of this license is published on https://www.oracle.com/downloads/licenses/oracle-free-license.html

FaStQL (excluding SQLcl) is licensed under the [Apache 2.0 License](https://github.com/BrNi05/FaStQL/blob/main/LICENSE).
