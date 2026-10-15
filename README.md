# Voltbook — static site

The Voltbook laptop store, built from the Claude Design handoff (`../project/Voltbook.dc.html`).
It's plain HTML/CSS/JS with no build step: open `index.html` or upload this folder to any static host.

## Pages
- Store: `index.html` (home) · `shop.html` (`?cat=gaming|ultrabook|creator|student|2in1`, `?q=search`) · `product.html?id=…` · `compare.html`
- Buying: `cart.html` · `checkout.html` · `order.html?id=…` (confirmation and order details)
- Account: `login.html` · `account.html`
- Info: `about.html` · `contact.html` · `shipping-returns.html` · `warranty.html` · `faq.html` · `privacy.html` · `404.html`

The header and footer are copied into every page. If you change a menu link, change it in all of them (search the folder for the link text).

## Files
- `css/nocturne.css`: Nocturne design-system tokens and components (copied from the design bundle)
- `css/site.css`: page layout for Voltbook
- `js/data.js`: the product catalog (names, prices, specs, image paths) and each laptop's "Best for" label and pros/cons
- `js/app.js`: accounts, cart, checkout, orders, search, compare, phone menu, contact form
- `img/`: laptop illustrations, one for each product (`p-<id>.svg`) and category (`cat-<slug>.svg`), plus `og-image.png`, the picture shown when someone shares a link to the site
- `vendor/phosphor/`: Phosphor icon fonts (MIT), served locally

## Before you submit
1. **Contact form:** messages are emailed to tedd.ton@lvjusd.org by FormSubmit (https://formsubmit.co), with no account needed. Once the site is online, send one test message from the Contact page. FormSubmit then emails that address an **activation link**: click it once, and every message after that arrives in the inbox. To change the address, edit the form's `action` (and the two `mailto:` links) in `contact.html`.
2. **Footer:** fill in the build time and prompt count in the footer of every page (search for `___`).
3. **Link previews:** every page's `og:url` and `og:image` tags assume the site lives at `https://bruhiamnotputtingausername.github.io/APCSP-AISite/`. If you host it somewhere else, search and replace that address.
4. **Photos (optional):** to use real photos, put them in `img/` and change the paths in `js/data.js`. Photos shot on dark backgrounds blend in best.

## Accounts and cart
Sign-up, log-in, carts and order history are saved in the visitor's browser (localStorage). To demo it: sign up, add to cart, log out, log back in, and the cart is still there. Place an order and it shows up in the order history.

## Publishing
Drag this `site/` folder onto https://app.netlify.com/drop, or push it to GitHub Pages. `404.html` is picked up automatically by both.
