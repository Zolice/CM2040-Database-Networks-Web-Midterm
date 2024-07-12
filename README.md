<div id="top" align="center">
  <a href="https://github.com/Zolice/CM2040-Database-Networks-Web-Midterm">
    <img src="https://avatars.githubusercontent.com/u/17869608?s=240&v=4" alt="Logo" height="240">
  </a>

  <h3 align="center">CM2040-Database-Networks-Web-Midterm</h3>

  <p align="center">
    Project assigned by SIM GE - UOL for the purpose of CM2040 Databases, Networks and The Web
    <br />
    <a href="https://github.com/Zolice/CM2040-Database-Networks-Web-Midterm">View Demo</a>
    ·
    <a href="https://github.com/Zolice/CM2040-Database-Networks-Web-Midterm/issues">Report Bug</a>
    ·
    <a href="https://github.com/Zolice/CM2040-Database-Networks-Web-Midterm/issues">Request Feature</a>
  </p>
</div>

<!-- TABLE OF CONTENTS -->
<details>
  <summary>Table of Contents</summary>
  <ol>
    <li>
      <a href="#about-the-project">About The Project</a>
      <ul>
        <li><a href="#built-with">Built With</a></li>
      </ul>
    </li>
    <li>
      <a href="#getting-started">Getting Started</a>
      <ul>
        <li><a href="#prerequisites">Prerequisites</a></li>
        <li><a href="#setting-up">Setting Up</a></li>
        <ul>
            <li><a href="#run-tailwindcss-to-watch">Run TailwindCSS to watch</a></li>
            <li><a href="#build-the-database">Build the database</a></li>
            <li><a href="#run-the-server">Run the server</a></li>
        </ul>
      </ul>
    </li>
    <li><a href="#usage">Usage</a></li>
    <li><a href="#roadmap">Roadmap</a></li>
    <li><a href="#license">License</a></li>
    <li><a href="#acknowledgments">Acknowledgments</a></li>
  </ol>
</details>

# About The Project
Project assigned by SIM GE - UOL for the purpose of CM2040 Databases, Networks and The Web

## Built With
![NodeJS](https://img.shields.io/badge/NodeJS-339933?style=for-the-badge&logo=node.js&logoColor=FFFFFF)
![TailwindCSS](https://img.shields.io/badge/TailwindCSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=FFFFFF)
![DaisyUI](https://img.shields.io/badge/DaisyUI-FF00FF?style=for-the-badge&logo=tailwind-css&logoColor=FFFFFF)

The following libraries and their respective prerequisites are used in this project:
- [TailwindCSS](https://tailwindcss.com/)
- [DaisyUI](https://daisyui.com/)
- [Bcrypt](https://www.npmjs.com/package/bcrypt)
- [Dotenv](https://www.npmjs.com/package/dotenv)
- [Express](https://expressjs.com/)
- [Express-Session](https://www.npmjs.com/package/express-session)
- [Express-Validator](https://express-validator.github.io/docs/)
- [sqlite3](https://www.npmjs.com/package/sqlite3)

<p align="right"><a href="#top">back to top</a></p>

# Getting Started
## Prerequisites

* Install all node packages using the following command
  ```
  npm install
  ```

## Setting Up

### Run TailwindCSS to watch
_This is mainly used for development. Skip to [Build the database](#build-the-database) if you're only running the project._

* Run the following command to watch TailwindCSS
   ```
   npm run build-css
   ```

### Build the database
_This is a required step._

* For Linux users, run the following command to build the database
   ```
   npm run build-db
   ```
* For Windows users, run the following command to build the database
   ```
    npm run build-db-win
    ```


### Run the server
_This is a required step._

* Run the following command to start the server
   ```
   npm run start
   ```

<p align="right"><a href="#top">back to top</a></p>

# Usage
- Change the port number in the `.env` file if needed. The default port is `3000`.
- Change the password in the `.env` file if needed. The default password is `password`.

_Refer here for more information_

<p align="right"><a href="#top">back to top</a></p>

# License
Distributed under the GPL License. See <a href="https://github.com/Zolice/CM2040-Database-Networks-Web-Midterm/LICENSE">License</a> for more information.

<p align="right"><a href="#top">back to top</a></p>

# Acknowledgments/References
* [TailwindCSS](https://tailwindcss.com/)
* [DaisyUI](https://daisyui.com/)
* [Bcrypt](https://www.npmjs.com/package/bcrypt)
* [Dotenv](https://www.npmjs.com/package/dotenv)
* [Express](https://expressjs.com/)
* [Express-Session](https://www.npmjs.com/package/express-session)
* [Express-Validator](https://express-validator.github.io/docs/)
* [sqlite3](https://www.npmjs.com/package/sqlite3)

<p align="right"><a href="#top">back to top</a></p>
