// Voltbook catalog. Edit products and categories here; every page reads from this file.
// Images live in img/: product photos are img/p-<id>.svg, category photos img/cat-<slug>.svg.
// To use real photos, drop e.g. img/p-air13.jpg in and change the `img` value below.
window.VB_DATA = {
  products: [
    { id: 'air13', name: 'Voltbook Air 13', cat: 'ultrabook', price: 1099, summary: '1.1 kg, 18‑hour battery, 2.8K OLED.', cpu: 'Intel Core Ultra 7', ram: '16GB', storage: '512GB SSD', gpu: 'Intel Arc (integrated)', display: '13.4" 2.8K OLED', battery: 'Up to 18 hours', weight: '1.1 kg' },
    { id: 'air15', name: 'Voltbook Air 15', cat: 'ultrabook', price: 1299, summary: 'Bigger screen, same all‑day battery.', cpu: 'Intel Core Ultra 7', ram: '16GB', storage: '1TB SSD', gpu: 'Intel Arc (integrated)', display: '15.3" 2.8K OLED', battery: 'Up to 17 hours', weight: '1.5 kg' },
    { id: 'pro14', name: 'Voltbook Pro 14', cat: 'creator', price: 1899, summary: 'Color‑accurate screen for photo and video.', cpu: 'Intel Core Ultra 9', ram: '32GB', storage: '1TB SSD', gpu: 'NVIDIA RTX 4060', display: '14.5" 3K 120Hz, 100% DCI‑P3', battery: 'Up to 12 hours', weight: '1.6 kg' },
    { id: 'pro16', name: 'Voltbook Pro 16', cat: 'creator', price: 2499, summary: 'Desktop power for 4K timelines.', cpu: 'Intel Core Ultra 9', ram: '64GB', storage: '2TB SSD', gpu: 'NVIDIA RTX 4070', display: '16" 3.2K 165Hz mini‑LED', battery: 'Up to 10 hours', weight: '2.1 kg' },
    { id: 'g15', name: 'Strike G15', cat: 'gaming', price: 1399, summary: 'RTX 4070 and a 240Hz screen.', cpu: 'AMD Ryzen 9', ram: '16GB', storage: '1TB SSD', gpu: 'NVIDIA RTX 4070', display: '15.6" QHD 240Hz', battery: 'Up to 7 hours', weight: '2.3 kg' },
    { id: 'g17', name: 'Strike G17', cat: 'gaming', price: 2199, summary: 'RTX 4080, big 17" screen, loud fans.', cpu: 'AMD Ryzen 9', ram: '32GB', storage: '2TB SSD', gpu: 'NVIDIA RTX 4080', display: '17.3" QHD 240Hz', battery: 'Up to 6 hours', weight: '2.9 kg' },
    { id: 'campus14', name: 'Campus 14', cat: 'student', price: 649, summary: 'Survives backpacks and all‑nighters.', cpu: 'AMD Ryzen 5', ram: '16GB', storage: '512GB SSD', gpu: 'AMD Radeon (integrated)', display: '14" FHD IPS', battery: 'Up to 14 hours', weight: '1.4 kg' },
    { id: 'flip13', name: 'Flip 13', cat: '2in1', price: 899, summary: 'Folds into a tablet, pen included.', cpu: 'Intel Core Ultra 5', ram: '16GB', storage: '512GB SSD', gpu: 'Intel Arc (integrated)', display: '13.3" FHD touch', battery: 'Up to 13 hours', weight: '1.3 kg' }
  ],
  cats: [
    { slug: 'gaming', name: 'Gaming', blurb: 'High‑refresh screens and real graphics cards for AAA games.' },
    { slug: 'ultrabook', name: 'Ultrabooks', blurb: 'Thin, light and all‑day battery.' },
    { slug: 'creator', name: 'Creator / Pro', blurb: 'Color‑accurate screens for photo and video.' },
    { slug: 'student', name: 'Student', blurb: 'Tough and affordable.' },
    { slug: '2in1', name: '2‑in‑1', blurb: 'Laptop, tablet and sketchpad in one.' }
  ],
  bestSellers: ['air13', 'g15', 'pro14', 'campus14'],

  // "Best for" label and the "Our take" pros/cons shown on each product page.
  reviews: {
    air13: { bestFor: 'Travel and all‑day note‑taking', pros: ['Lightest laptop we sell at 1.1 kg', 'Lasted 16 hours in our real‑work test', 'OLED screen is sharp and bright'], cons: ['Only two USB‑C ports', '512GB fills up fast with photos'] },
    air15: { bestFor: 'Spreadsheets and split‑screen work', pros: ['Big screen without the weight', 'Quiet: no fan noise under normal use', '1TB of storage as standard'], cons: ['Too big for small backpacks', 'Integrated graphics only'] },
    pro14: { bestFor: 'Photo editing on the go', pros: ['Color‑accurate screen out of the box', 'RTX 4060 speeds up video exports', 'Still light enough to carry daily'], cons: ['Fans get loud during exports', 'Expensive for a 14" laptop'] },
    pro16: { bestFor: '4K video and 3D work', pros: ['64GB of memory handles huge projects', 'Mini‑LED screen with deep blacks', 'Fastest exports in our testing'], cons: ['2.1 kg plus a heavy charger', 'Battery drops fast under load'] },
    g15: { bestFor: 'Competitive and AAA gaming', pros: ['240Hz screen feels very smooth', 'RTX 4070 runs new games at high settings', 'Good keyboard with per‑key lighting'], cons: ['About 4 hours of battery while browsing', 'Heavy power brick'] },
    g17: { bestFor: 'A desktop replacement for gaming', pros: ['RTX 4080 is the fastest GPU we sell', 'Large 17" screen', 'Plenty of ports, including Ethernet'], cons: ['Fans are loud while gaming', '2.9 kg: it mostly stays on a desk'] },
    campus14: { bestFor: 'Students on a budget', pros: ['Under $650 with 16GB of memory', 'Survived our backpack drop tests', 'Full school day on one charge'], cons: ['Screen is dimmer than pricier models', 'Not built for gaming'] },
    flip13: { bestFor: 'Handwritten notes and sketching', pros: ['Folds into a tablet', 'Pen included and stored in the side', 'Touch screen works well for notes'], cons: ['Glossy screen reflects light', 'Gets warm in tablet mode'] }
  }
};
VB_DATA.products.forEach(p => { p.img = 'img/p-' + p.id + '.svg'; });
VB_DATA.cats.forEach(c => { c.img = 'img/cat-' + c.slug + '.svg'; });
