// Report body, part 1: sections 1 to 7 (abstract to hardware and software requirements).
'use strict';
const path = require('path');

module.exports = function (ctx, env) {
  const dg = (name) => path.join(env.diagrams, name + '.png');
  const R = env.results;

  ctx.section(false, { first: true });

  /* ------------------------------------------------------------ 1 abstract */
  ctx.title('Abstract', 'sec01');
  ctx.p('SwiftCart is an upgraded e-commerce storefront designed for an online store that is losing customers to slow pages and abandoned shopping carts. Shoppers of the existing store complain that every click reloads the whole page, that the delivery charge appears only at the end, that they are forced to create an account, and that the eight-screen checkout is long and unforgiving. As a result, a large share of carts never become orders. SwiftCart addresses these problems by redesigning how products are browsed, how the cart behaves and how an order is placed.');
  ctx.p('The project analyses user feedback, ranks the causes of abandonment, and turns them into prioritised requirements and user stories. The resulting design is a single-page storefront that responds without page reloads, shows the full amount payable (items, discount and delivery) in the cart, saves the cart between visits, and replaces the old checkout with a three-step guest checkout on one page. Shoppers can pay by UPI, card or cash on delivery, review each order on a confirmation page, and return later to a "My orders" page that lists every order with its estimated arrival date.');
  ctx.p('A working prototype was built with HTML, CSS and JavaScript and verified with ' + (R.unit.tests + R.e2e.tests) + ' automated tests (' + R.unit.tests + ' unit tests and ' + R.e2e.tests + ' end-to-end browser tests), all of which pass. The work follows the software engineering life cycle, from requirement analysis and a Software Requirements Specification through UML design, implementation and testing, using an Agile Scrum plan with a user story map and sprint backlog. The design can be extended with a real back end, a payment gateway, order tracking and analytics to measure the drop in cart abandonment after release.');

  /* -------------------------------------------------------- 2 introduction */
  ctx.title('Introduction', 'sec02');
  ctx.p('Online shopping depends on a short and predictable path from finding a product to paying for it. When pages are slow, prices change late in the process or the checkout asks for too much, shoppers leave and the sale is lost. SwiftCart is a project to upgrade the storefront of such a store: it keeps the same products and prices, but changes the software so that browsing is fast, costs are clear from the start, and an order can be placed in a few short steps without creating an account.');
  ctx.p('From a software engineering perspective, the project covers the full development life cycle. User feedback is analysed to identify requirements; improvements are prioritised by impact and effort; requirements are written as a Software Requirements Specification and as user stories; the system is modelled with UML diagrams; a working prototype is implemented; and the prototype is verified with automated unit and end-to-end tests. Agile Scrum is used to plan the work in short sprints so that the most valuable improvements reach shoppers first.');
  ctx.p('SwiftCart is a fictitious store created for this activity, but the problems it addresses are common to many online stores, especially those whose customers shop on mobile phones. The same approach can be applied to any retail website that suffers from slow pages and cart abandonment. Future enhancements include a production back end with a database, a real payment gateway, order tracking with courier updates, and analytics dashboards that show where shoppers drop out of the checkout.');

  /* --------------------------------------------------- 3 problem statement */
  ctx.title('Problem Statement', 'sec03');
  ctx.p('An online store receives growing complaints about slow performance, and a large share of the shoppers who add products to the cart leave without paying. The existing storefront reloads the whole page for every action, shows the delivery charge only on the sixth of eight checkout screens, forces every shopper to register and verify an email address, accepts only card payments through a redirect, and loses the cart when the session expires. Each of these issues gives shoppers a reason to abandon their purchase.');
  ctx.p('The problem is to design an upgraded e-commerce storefront that loads quickly and lets a shopper move from cart to confirmed order in a few short steps, with the full payable amount visible from the start, a choice of payment methods, no forced account creation, and a way to look back at placed orders, so that fewer carts are abandoned. The project aims to streamline the purchase journey, reduce the effort and uncertainty involved in checking out, and give the store the measurements it needs to keep improving.');

  /* ---------------------------------------------- 4 objectives of the project */
  ctx.title('Objectives of the Project', 'sec04');
  ctx.p('The main objectives of the SwiftCart project are:', { keepNext: true, after: 120 });
  ctx.list([
    'To analyse user feedback and identify the main causes of slow performance and cart abandonment.',
    'To reduce the checkout from eight screens to a single page with three steps (contact and address, delivery, payment).',
    'To show the complete payable amount, including discount and delivery charge, in the cart before checkout starts.',
    'To allow shoppers to place an order as a guest, without creating an account.',
    'To keep the cart between visits and remind returning shoppers that it was saved.',
    'To offer UPI, card and cash on delivery as payment methods, and never store card details.',
    'To let shoppers view their placed orders and the estimated arrival date of each.',
    'To meet the Core Web Vitals "good" thresholds and cut cart abandonment from an assumed 78% to 65% or lower.'
  ]);

  /* ----------------------------------------------------- 5 literature survey */
  ctx.title('Literature Survey', 'sec05', { samePage: true });
  ctx.p('The Baymard Institute reports an average documented online cart abandonment rate of about 70% [1]. The most common reasons shoppers give are extra costs appearing late, being required to create an account, a long or complicated checkout and not seeing the total cost up front [2]. Speed matters as much: 53% of mobile visits are abandoned if a page takes longer than three seconds to load [3], and Google\'s Core Web Vitals set targets of 2.5 seconds for loading, 200 milliseconds for responsiveness and 0.1 for layout shift [4].');
  ctx.p('Conventional multi-page checkouts collect sign-in, shipping, billing, delivery and payment on separate screens. Modern single-page guest checkouts ask only for what is needed to deliver the order and validate it as it is entered. SwiftCart applies these findings and, as software engineering texts recommend [5][6], is developed iteratively with Scrum [8].');

  /* -------------------------------------------------------- 6 system design */
  ctx.title('System Design', 'sec06');
  ctx.p('SwiftCart follows a layered, three-tier client-server architecture. Shoppers interact with the storefront through a web browser, which runs a single-page application: pages change without reloading, and only data is requested from the server. The application tier exposes the catalogue, cart, checkout, payment, delivery and notification functions as services behind an API gateway, and the data tier stores products, orders and carts. A content delivery network (CDN) and a cache keep the storefront fast during sales.');
  ctx.p('The architecture consists of five layers, as shown in ' + ctx.F('architecture') + '. The presentation layer contains the storefront views: catalogue, product page, cart drawer, checkout, confirmation and order history. The API layer routes requests, limits their rate and validates input. The service layer holds one service per business capability, and the domain layer holds the business rules, such as pricing, validation, promotions and the order state machine, with no user-interface code. The data layer uses a relational database for products and orders and an in-memory cache for carts and catalogue data. Security, performance, observability and integration with the payment gateway, courier and email services apply across all layers.');
  ctx.fig('architecture', dg('15-architecture'), 'Layered three-tier architecture. Green labels show the prototype file that plays each role.', { maxH: 330 });

  /* ------------------------------------- 7 hardware and software requirements */
  ctx.title('Hardware and Software Requirements', 'sec07');
  ctx.table('hardware', 'Hardware requirements', ['Component', 'Minimum requirement'], [
    ['Processor', 'Dual-core processor (1.6 GHz) or equivalent'],
    ['RAM', '4 GB minimum; 8 GB recommended for running the browser tests'],
    ['Storage', 'At least 500 MB of free space (prototype under 1 MB; test tools about 35 MB)'],
    ['Display', '1280 × 800 or larger for development; any phone screen from 360 px wide for shoppers'],
    ['Shopper device', 'Smartphone, tablet, laptop or desktop with a current web browser'],
    ['Internet connectivity', 'Not needed to run the prototype; needed once to install the test tools, and in production']
  ], [1, 1.25]);
  ctx.table('software', 'Software requirements', ['Component', 'Software / Technology'], [
    ['Operating system', 'Windows 10 or 11, macOS or Linux'],
    ['Programming languages', 'HTML5, CSS3, JavaScript (ES2020)'],
    ['Framework', 'None: plain JavaScript single-page application with no build step'],
    ['Data storage (prototype)', 'Static catalogue file and browser localStorage'],
    ['Runtime environment', 'Node.js 18 or later (tests only; ' + R.node + ' used)'],
    ['Package manager', 'npm'],
    ['Unit testing', 'Node.js built-in test runner (node:test)'],
    ['End-to-end testing', 'puppeteer-core driving Microsoft Edge or Google Chrome'],
    ['Diagrams and report', 'SVG diagrams rendered in a headless browser; docx library for this report'],
    ['Code editor', 'Visual Studio Code or any suitable editor'],
    ['Browser', 'Google Chrome, Microsoft Edge, Firefox or Safari (latest versions)'],
    ['Version control', 'Git and GitHub']
  ], [1, 1.25]);
};
