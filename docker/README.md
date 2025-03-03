# Docker

If you want to avoid all the hassle of installing the dependencies, configuring nginx and so on you can try our docker image which makes things a bit simpler.

First make sure you have docker and docker composer installed, so please follow the install instructions for your OS/Distro:
- https://docs.docker.com/engine/install/debian/
- https://docs.docker.com/compose/install/

After that:
- Copy the config file called `docker-compose.config.example.yml` and name it `docker-compose.config.yml` with the values you want. Those that are left commented will use the default values.
- Copy either `lolisafe.tld.http.example.conf` or `lolisafe.tld.https.example.conf` and name it `lolisafe.tld.conf` for either HTTP or HTTPS
- - If using HTTPS make sure to put your certificates into the `ssl` folder and name them accordingly:
- - - `lolisafe.tld.crt` for the certificate
- - - `lolisafe.tld.key` for the certificate key

Once you are done run the following commands:

- `cd docker`
- `./lolisafe.sh prod pull`
- `./lolisafe.sh prod build`
- `./lolisafe.sh prod up -d`

Use `./lolisafe.ps1` instead if you are on a Windows host.

Congrats, your lolisafe instance is now running.
