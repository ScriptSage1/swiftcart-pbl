# E-Commerce Platform Upgrade: Software Engineering PBL

An online store receives complaints about slow performance and cart abandonment. This project
analyses the feedback, prioritises improvements, and designs, prototypes and tests an upgraded
storefront ("SwiftCart") with a three-step guest checkout.

## What is here

| Path | Contents |
|---|---|
| `report/PBL_Report_SwiftCart.docx` | The PBL report in the department's 12-section format, 24 pages (PDF copy alongside) |
| `report/diagrams/` | All report figures as PNG, including the nine UML diagrams and the architecture |
| `report/screenshots/` | Screens captured from the running prototype |
| `prototype/` | The working prototype and its tests |
| `report/build/` | Scripts that regenerate the diagrams, screenshots and report |

## Run the prototype

Open `prototype/index.html` in a browser. Nothing needs to be installed.

For the demo: use the promo code `WELCOME10`, the UPI ID `demo@upi`, or the test card
`4111 1111 1111 1111` with any future expiry date. PIN codes such as `560001` or `400001`
fill in the city and state. Payments and emails are simulated.

Product photos are stored locally in `prototype/images/` (free-licence Unsplash photos, credited
in `prototype/images/CREDITS.md`), so the catalogue works offline.

## Run the tests

```bash
cd prototype
npm test            # 34 unit tests, no dependencies
npm install         # once, for the browser tests
npm run test:e2e    # 31 end-to-end tests in headless Edge or Chrome
```

## Rebuild the report

Only needed after changing a diagram or the report text in `report/build/`. Student names, guide,
college details and the GitHub link on the front pages are in `report/build/report-details.js`.

```bash
cd report/build
npm install
npm run diagrams      # redraw report/diagrams
npm run screenshots   # recapture report/screenshots
npm run report        # rebuild the .docx
```

Then run `finalize-report.ps1` (needs Microsoft Word) to fill in the page numbers of the table
of contents and export the PDF:

```powershell
.\finalize-report.ps1 -Docx "$PWD\..\PBL_Report_SwiftCart.docx" -Pdf "$PWD\..\PBL_Report_SwiftCart.pdf"
```

Rebuilding overwrites any edits made directly in Word, so for small text changes it is simpler
to edit the `.docx`.
