// Polyfill's.
import 'whatwg-fetch';
import 'core-js/features/promise';

// STYLES
import 'bootstrap/dist/css/bootstrap.min.css';
import 'components-font-awesome/css/font-awesome.min.css';
import './libs/jssocials/dist/jssocials.css';
import './libs/jssocials/dist/jssocials-theme-flat.css';
import './styles/main.css';
import './styles/jplayer.css';

// GLOBAL.
const $ = require('jquery');
const Immutable = require('immutable');
const moment = require('moment');
window.$ = window.jQuery = $;
window.Immutable = Immutable;
window.moment = moment;

require('./libs/jssocials/dist/jssocials.js');
require('./libs/jPlayer/dist/jplayer/jquery.jplayer.js');
require('./libs/slip/slip.js');
require('./libs/Touchy/dist/touchy.js');

// bootstrap plugins load.
require('bootstrap/js/affix.js');
require('bootstrap/js/alert.js');
require('bootstrap/js/dropdown.js');
require('bootstrap/js/tooltip.js');
require('bootstrap/js/modal.js');
require('bootstrap/js/transition.js');
require('bootstrap/js/button.js');
require('bootstrap/js/popover.js');
require('bootstrap/js/carousel.js');
require('bootstrap/js/scrollspy.js');
require('bootstrap/js/collapse.js');
require('bootstrap/js/tab.js');

// app scripts.
require('script-loader!./scripts/jplayer.playlist.min.js');
require('script-loader!./scripts/util.js');
require('script-loader!./scripts/analyticsService.js');
require('script-loader!./scripts/loginHelper.js');
require('script-loader!./scripts/loginController.js');
require('script-loader!./scripts/dataStore.js');
require('script-loader!./scripts/requestHelper.js');
require('script-loader!./scripts/playlistPlayer.js');
require('script-loader!./scripts/carousel.js');
require('script-loader!./scripts/filter.js');
require('script-loader!./scripts/playlist.js');
require('script-loader!./scripts/grid.js');
require('script-loader!./scripts/main.js');
require('script-loader!./scripts/i18nSwedish.js');
require('script-loader!./scripts/i18nEnglish.js');
require('script-loader!./scripts/i18n.js');
