# Roam local editing

## Getting started

Install and create a .env file:

```
npm install
cp .env.example .env
```

Add your Roam graph name and api token to the .env file.

Run the server:

```
npm start
```

Add a directory in the `blocks` directory with the block's uid as the name. Files added to this directory will be added to the block's content.

(Optional) Listen for changes on the client by taking the content of `client.js` and adding it to the console in your browser.

## Related

- [taylormitchell/roam-local-scripting](https://github.com/taylormitchell/roam-local-scripting)
