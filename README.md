# WEB PLAYER
This is the code for the webplayer app.

## Build & development
* `npm install` install npm (first-time setup only)

* `npm run serve` for build and run during local development.
* `npm run build` for build for production/deployment (to the dist folder).

## Deployment

Add a 'player' folder to the Apache web root in the EC2 instance.
Copy all the files from your local 'dist' folder to the player folder.

## TODO-list
* When sharing an article to FB the poster image isn't shared. Might be because we
are using deprecated FB-APIs for this.

* The paging component at the bottom of the screen contains many pages and looks really
crappy on small screens. Until we have a better solution (like infinite scrolling) we
could at least remove the paging component and only use prev/next buttons.
