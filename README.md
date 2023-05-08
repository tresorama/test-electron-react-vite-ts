# How to use

```bash
# launch Vite (react) dev server, 
# and electron dev server
# then code in apps/electron for electron-side
# then code in apps/rendere-react for react-side
yarn dev
```

```bash
# bundle react code with vite (putting it inside apps/electron folder)
# then pacakging the electron app
# NOTE: this will not create distributables.
yarn build:package
```

```bash
# bundle react code with vite (putting it inside apps/electron folder)
# then pacakging the electron app in a distribuable (.exe, .dmg, ...)
yarn build:make
```