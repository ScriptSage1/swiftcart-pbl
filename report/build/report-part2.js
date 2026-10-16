// Report body, part 2: section 8 (implementation), following the phases of the development life cycle.
'use strict';
const path = require('path');

module.exports = function (ctx, env) {
  const dg = (name) => path.join(env.diagrams, name + '.png');
  const R = env.results;
  const uml = (n, name, text) => ctx.p('**' + n + '. ' + name + ':** ' + text, { keepNext: true, after: 60 });

  ctx.title('Implementation', 'sec08');
  ctx.p('The implementation of SwiftCart follows the Software Development Life Cycle (SDLC), which provides a systematic approach to planning, analysing, designing, developing, testing and maintaining software. Within the life cycle the work is organised with Agile Scrum [8]: requirements are kept in a prioritised product backlog and delivered in two-week sprints, so that the improvements with the greatest effect on abandonment reach shoppers first.');

  /* ------------------------------------------- requirements gathering and analysis */
  ctx.h2('Requirements Gathering and Analysis');
  ctx.p('The stakeholders are guest shoppers, returning customers, the store owner, the marketing and customer support teams, the operations team that ships orders, and the development team, with the payment gateway and courier as external systems. Because the scenario provides no data, a representative sample of 500 feedback items was assumed from reviews, support tickets, exit surveys and social media, and each item was coded into one theme by affinity mapping.');
  ctx.p('Slow pages formed the largest single theme (26.4%), but checkout friction was the larger family overall (65.8%). Four themes (slow pages, unexpected costs, forced account creation and a long checkout) account for 72.4% of all feedback, and each was traced to a root cause in the existing store: full page reloads and heavy images, a delivery charge first shown on screen 6 of 8, mandatory registration, and twelve address fields with errors shown only after submitting. Fourteen candidate improvements were scored on an impact/effort matrix and given MoSCoW priorities; guest checkout, costs shown in the cart, a three-step checkout, a saved cart and faster loading were the quick wins chosen for the first release.');

  /* -------------------------------------------------------------- SRS */
  ctx.h2('Software Requirements Specification (SRS)');
  ctx.p('The SRS, following the outline of IEEE Std 830 [9], defines the expected behaviour, constraints and quality requirements of SwiftCart and serves as the reference for design and testing. The major functional requirements are:', { keepNext: true, after: 120 });
  ctx.list([
    '**Catalogue:** List, filter, sort and search products, and show the photo, tax-inclusive price, saving and stock of each.',
    '**Cart:** Add products without reloading, change quantities within stock limits, undo removals, and keep the cart between visits.',
    '**Transparent pricing:** Show subtotal, discount, delivery charge and total payable in the cart, before checkout starts.',
    '**Guest checkout:** Place an order without an account in three steps on one page, with inline validation and PIN-code auto-fill.',
    '**Delivery and payment:** Offer standard and express delivery with dates; accept UPI, card or cash on delivery; never store card details; apply promo codes.',
    '**Orders:** Confirm each order with its number, items, amount and arrival estimate, and list all placed orders on a My orders page.',
    '**Recovery and analytics:** Remind returning shoppers of a saved cart and record checkout funnel events.'
  ]);
  ctx.p('The non-functional requirements are page speed within the Core Web Vitals "good" thresholds (LCP ≤ 2.5 s, INP ≤ 200 ms, CLS ≤ 0.1) [4], 99.9% availability of checkout, HTTPS throughout with card data handled only by a PCI-DSS-compliant gateway, accessibility to WCAG 2.1 level AA, support for current browsers on screens from 360 px wide, and business rules kept in one unit-tested module.');

  /* ----------------------------------------------------------- sprint planning */
  ctx.h2('Sprint Planning');
  ctx.p('The requirements were rewritten as 22 user stories with acceptance criteria and story-point estimates, arranged on a user story map [7] and planned over three two-week sprints for a team of four (' + ctx.T('release') + ').', { keepNext: true });
  ctx.table('release', 'Release plan and sprint backlog', ['Sprint', 'Sprint goal', 'Points'], [
    ['Sprint 1', 'A guest can add products to a saved cart, see the full amount payable and place an order in three steps.', '32'],
    ['Sprint 2', 'Instant search, inline validation, PIN auto-fill, saved details, promo codes and three payment methods.', '32'],
    ['Sprint 3', 'CDN and caching, mobile polish, payment retry, cart reminders, funnel analytics and order history.', '31']
  ], [1.2, 6.4, 1.0], { center: [2], size: 21 });

  /* ----------------------------------------------------------- system design */
  ctx.h2('System Design');
  ctx.p('SwiftCart uses the layered client-server architecture described in Section 6. The key design change is the checkout workflow: the old eight-screen flow is replaced by a cart drawer that already shows the full total, followed by three steps on one page (contact and address, delivery, payment). Each completed step collapses to an editable summary, payment happens on the same page, and the confirmed order appears on the My orders page.');

  /* ------------------------------------------------------------ UML diagrams */
  ctx.h2('UML Diagrams');
  ctx.p('Unified Modeling Language (UML) diagrams represent the structure and behaviour of a software system [10]. The following nine diagrams model SwiftCart.', { after: 120 });
  uml(1, 'Use Case Diagram', 'The Shopper browses, manages the cart, checks out as a guest and tracks orders; *Check out as guest* includes contact, delivery and payment and is extended by a promo code. The Store Admin and external systems are also actors.');
  ctx.fig('usecase', dg('06-use-case'), 'Use case diagram.', { maxH: 290 });
  uml(2, 'Class Diagram', 'A Cart is composed of CartItems that refer to Products. A CheckoutSession creates an Order, whose OrderItems copy product names and prices. Payment is abstract, with one subclass per payment method.');
  ctx.fig('class', dg('07-class-diagram'), 'Class diagram.', { maxH: 300 });
  uml(3, 'Object Diagram', 'An example runtime state: one guest order for two items with the WELCOME10 code and free delivery (₹7,398 − ₹500 = ₹6,898), paid by UPI.');
  ctx.fig('object', dg('16-object-diagram'), 'Object diagram of one placed order.', { maxH: 300 });
  uml(4, 'Activity Diagram', 'The enhanced checkout across the shopper, storefront and back-end services. Invalid input and declined payments return to the same step with everything kept.');
  ctx.fig('activity', dg('09-activity-checkout'), 'Activity diagram of the checkout.', { maxH: 330 });
  uml(5, 'Sequence Diagram', 'The messages of one guest checkout paid by UPI, with the success and failure outcomes of the payment.');
  ctx.fig('sequence', dg('08-sequence-checkout'), 'Sequence diagram of a guest checkout.', { maxH: 320 });
  uml(6, 'Collaboration Diagram', 'How the prototype\'s objects cooperate to place an order and to show the order history.');
  ctx.fig('collab', dg('17-collaboration-order'), 'Collaboration diagram of placing and viewing orders.', { maxH: 290 });
  uml(7, 'State Chart Diagram', 'The life cycle of an Order from Created to Delivered; cash on delivery skips payment, and failed payments or timeouts cancel the order.');
  ctx.fig('state', dg('10-state-order'), 'State chart diagram of an Order.', { maxH: 320 });
  uml(8, 'Component Diagram', 'The storefront depends only on the API gateway, which routes to the application services; only three services talk to external systems.');
  ctx.fig('component', dg('11-component'), 'Component diagram.', { maxH: 300 });
  uml(9, 'Deployment Diagram', 'Static files are served from a CDN; API calls pass through a load balancer to scalable application servers backed by Redis and PostgreSQL.');
  ctx.fig('deployment', dg('12-deployment'), 'Deployment diagram.', { maxH: 300 });

  /* -------------------------------------------------- development and testing */
  ctx.h2('Development and Testing');
  ctx.p('The prototype is a single-page application written in HTML5, CSS3 and plain JavaScript with no framework or build step, so it runs by opening `prototype/index.html` in any current browser. It is organised in layers: `app.js` and `ui.js` hold the views (catalogue, product page, cart drawer, checkout, confirmation and My orders), `store.js` keeps the cart, saved details and orders in local storage, `core.js` holds the business rules as pure functions, and `data.js` holds the catalogue. Product photos [13] are stored locally and lazy-loaded; payments, the PIN-code service and emails are simulated.');
  ctx.p('Testing was done at two levels [6]. ' + R.unit.tests + ' unit tests, written with the Node.js test runner [11], check the cart, promotion, totals, validation and delivery rules, including boundary values such as an order of exactly ₹999. ' + R.e2e.tests + ' end-to-end tests drive the prototype in Microsoft Edge with puppeteer-core [12] at desktop and phone sizes, covering the catalogue, cart, checkout, all three payment methods, saved details, script injection, the mobile layout, analytics events and the My orders page.');
};
