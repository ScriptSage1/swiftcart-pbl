// Report body, part 3: sections 9 to 12 (results and discussion, conclusion, references, GitHub link).
'use strict';
const path = require('path');
const { D } = require('./report-kit.js');
const { Paragraph, TextRun, AlignmentType } = D;

module.exports = function (ctx, env) {
  const shot = (name) => path.join(env.screenshots, name + '.jpg');
  const R = env.results;
  const S = { dims: [1280, 800], frame: true, maxH: 222 };

  /* ------------------------------------------------- 9 results and discussion */
  ctx.title('Results and Discussion', 'sec09');
  ctx.fig('shot-catalogue', shot('02-catalogue'), 'Catalogue with product photos, filters, tax-inclusive prices and one-tap Add buttons.', S);
  ctx.fig('shot-product', shot('03-product'), 'Product page with saving, stock status and delivery check by PIN code.', S);
  ctx.fig('shot-cart', shot('04-cart-drawer'), 'Cart drawer showing free-delivery progress and the full amount payable.', S);
  ctx.fig('shot-details', shot('06-checkout-details'), 'Three-step checkout: city and state filled in from the PIN code, promo code applied.', S);
  ctx.fig('shot-confirm', shot('09-confirmation'), 'Order confirmation with order number, arrival estimate and status timeline.', S);
  ctx.fig('shot-orders', shot('13-my-orders'), 'My orders: every placed order with its total, items and estimated arrival.', S);
  ctx.figRow('shot-mobile', [shot('10-mobile-home'), shot('11-mobile-cart'), shot('12-mobile-checkout')], 'The prototype at phone width (390 px): home page, cart and checkout.', { dims: [390, 800], maxW: 150, maxH: 300 });

  ctx.p('Both test suites were run on Windows 11 with Node.js ' + R.node + ' and Microsoft Edge. All ' + (R.unit.tests + R.e2e.tests) + ' tests passed (' + ctx.T('results') + '). Testing also found two real defects earlier in development, a fading backdrop that swallowed the next click and a message that could cover an Add button; both were fixed and retested.', { keepNext: true });
  ctx.table('results', 'Summary of the final test run', ['Suite', 'Tests', 'Passed', 'Failed', 'Duration'], [
    ['Unit tests', String(R.unit.tests), String(R.unit.pass), String(R.unit.fail), R.unit.duration],
    ['End-to-end tests', String(R.e2e.tests), String(R.e2e.pass), String(R.e2e.fail), R.e2e.duration],
    [{ text: 'Total', bold: true }, { text: String(R.unit.tests + R.e2e.tests), bold: true }, { text: String(R.unit.pass + R.e2e.pass), bold: true }, { text: String(R.unit.fail + R.e2e.fail), bold: true }, '']
  ], [2.6, 1, 1, 1, 1.4], { width: 6800, center: [1, 2, 3, 4], size: 21 });
  ctx.p(ctx.T('beforeafter') + ' compares the checkout of the existing store (assumed baseline) with the prototype (measured).', { keepNext: true });
  ctx.table('beforeafter', 'Checkout before and after the redesign', ['Aspect', 'Before', 'After'], [
    ['Screens from cart to order', '8', '1 page, 3 steps'],
    ['Account required', 'Yes, with email verification', 'No'],
    ['Required contact and address fields', '12, plus billing address', '7, two filled in from the PIN code'],
    ['Delivery charge first shown', 'Screen 6', 'In the cart'],
    ['Payment methods', 'Card (redirect)', 'UPI, card, cash on delivery'],
    ['Cart after a return visit', 'Lost', 'Kept, with a reminder'],
    ['Viewing past orders', 'Only after signing in', 'My orders page, no account needed']
  ], [3.0, 2.6, 3.0], { size: 21, keepTogether: true });
  ctx.p('The prototype meets the objectives that concern the design of the checkout and the order history, and partly meets the cart-reminder objective, since email and SMS reminders need a back end. Page speed in the field and the abandonment rate can only be confirmed with real shoppers; the front end is ' + R.sizeKb + ' KB of code plus ' + R.imagesKb + ' KB of lazy-loaded photos, and an A/B test after release would compare the completion rate of the old and new checkouts.');

  /* ---------------------------------------------- 10 conclusion and future scope */
  ctx.title('Conclusion and Future Scope', 'sec10');
  ctx.p('SwiftCart demonstrates how software engineering practice can turn customer complaints into a better product. Analysing user feedback showed that nearly three-quarters of the complaints came from four causes: pages that reload for every action, costs that appear late, a forced account and a long, unforgiving checkout. The upgraded storefront addresses each cause with a single-page design, a cart that shows the full amount payable and is saved automatically, a three-step guest checkout with inline validation, a choice of UPI, card or cash on delivery, and a My orders page with arrival estimates.');
  ctx.p('The project applied the full development life cycle, from requirement analysis and an SRS through sprint planning, nine UML diagrams and a layered architecture to a working prototype verified by ' + (R.unit.tests + R.e2e.tests) + ' automated tests. The current version has limitations: the feedback data and baseline figures are assumed, orders are kept only in the browser, payments and emails are simulated, and testing covered one browser engine. It is therefore suited to demonstration and academic purposes.');
  ctx.p('Future enhancements include a back end with a database for products, carts and orders, a real payment gateway with payment retry, user accounts that keep order history across devices, courier tracking, email and SMS cart reminders, a CDN for speed during sales, and analytics dashboards that show where shoppers drop out. With these in place, an A/B test after release would measure the actual reduction in cart abandonment.');

  /* --------------------------------------------------------------- 11 references */
  ctx.title('References', 'sec11');
  ctx.refs([
    'Baymard Institute. *Cart Abandonment Rate Statistics*. Available at: https://baymard.com/lists/cart-abandonment-rate',
    'OptinMonster. *Cart Abandonment Statistics*. Available at: https://optinmonster.com/cart-abandonment-statistics/',
    'Google. *The Need for Mobile Speed*, as reported by Marketing Dive. Available at: https://www.marketingdive.com/news/google-53-of-mobile-users-abandon-sites-that-take-over-3-seconds-to-load/426070/',
    'Google. *Web Vitals*. Available at: https://web.dev/articles/vitals',
    'Sommerville, I. *Software Engineering*, 10th ed. Pearson, 2016.',
    'Pressman, R. S., and Maxim, B. R. *Software Engineering: A Practitioner\'s Approach*, 8th ed. McGraw-Hill, 2015.',
    'Patton, J. *User Story Mapping*. O\'Reilly Media, 2014.',
    'Schwaber, K., and Sutherland, J. *The Scrum Guide*, 2020. Available at: https://scrumguides.org',
    'IEEE. *IEEE Std 830-1998: Recommended Practice for Software Requirements Specifications*, 1998.',
    'Object Management Group (OMG). *Unified Modeling Language (UML) Specification*. Available at: https://www.omg.org/spec/UML/',
    'Node.js. *Test Runner Documentation*. Available at: https://nodejs.org/api/test.html',
    'Puppeteer. *Puppeteer Documentation*. Available at: https://pptr.dev',
    'Unsplash. *Unsplash License*. Available at: https://unsplash.com/license'
  ]);

  /* ------------------------------------------------------------ 12 GitHub link */
  ctx.title('GitHub Repository', 'sec12', { samePage: true });
  const placeholder = /^\[.*\]$/.test(env.details.github);
  ctx.raw(new Paragraph({
    alignment: AlignmentType.LEFT,
    spacing: { line: 360 },
    children: [
      new TextRun({ text: 'GitHub Repository Link: ', bold: true }),
      new TextRun({ text: env.details.github, color: placeholder ? undefined : '0563C1', underline: placeholder ? undefined : {}, highlight: placeholder ? 'yellow' : undefined })
    ]
  }));
};
