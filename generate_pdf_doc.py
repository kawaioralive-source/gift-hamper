import os
import sys
from reportlab.lib.pagesizes import letter
from reportlab.lib import colors
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, PageBreak, KeepTogether, HRFlowable
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.enums import TA_CENTER, TA_LEFT, TA_RIGHT, TA_JUSTIFY

def build_pdf():
    pdf_filename = os.path.join(os.path.dirname(__file__), "KawaiOra_Artisan_Hampers_App_Documentation.pdf")
    
    doc = SimpleDocTemplate(
        pdf_filename,
        pagesize=letter,
        rightMargin=36,
        leftMargin=36,
        topMargin=36,
        bottomMargin=36
    )

    styles = getSampleStyleSheet()

    # Custom Color Palette
    c_primary = colors.HexColor('#0f172a')   # Deep Slate
    c_accent = colors.HexColor('#d4af37')    # Champagne Gold
    c_emerald = colors.HexColor('#10b981')   # Emerald Green
    c_rose = colors.HexColor('#e11d48')      # Crimson Rose
    c_slate_dark = colors.HexColor('#1e293b')
    c_slate_light = colors.HexColor('#f8fafc')
    c_text_dark = colors.HexColor('#0f172a')
    c_text_muted = colors.HexColor('#64748b')

    # Typography Styles
    style_doc_title = ParagraphStyle(
        'DocTitle',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=22,
        leading=26,
        textColor=c_accent,
        alignment=TA_CENTER
    )

    style_doc_subtitle = ParagraphStyle(
        'DocSubtitle',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=12,
        leading=16,
        textColor=colors.white,
        alignment=TA_CENTER
    )

    style_page_header = ParagraphStyle(
        'PageHeader',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=16,
        leading=20,
        textColor=c_slate_dark,
        spaceAfter=6
    )

    style_section_title = ParagraphStyle(
        'SectionTitle',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=12,
        leading=16,
        textColor=c_rose,
        spaceBefore=8,
        spaceAfter=4
    )

    style_body = ParagraphStyle(
        'BodyTextCustom',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=9.5,
        leading=13,
        textColor=c_text_dark
    )

    style_body_bold = ParagraphStyle(
        'BodyTextBold',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=9.5,
        leading=13,
        textColor=c_text_dark
    )

    style_code = ParagraphStyle(
        'CodeStyle',
        parent=styles['Normal'],
        fontName='Courier-Bold',
        fontSize=9,
        leading=11,
        textColor=c_emerald
    )

    style_th = ParagraphStyle(
        'TableHeader',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=9,
        leading=11,
        textColor=colors.white,
        alignment=TA_LEFT
    )

    style_td = ParagraphStyle(
        'TableCell',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=8.5,
        leading=11,
        textColor=c_text_dark
    )

    style_td_bold = ParagraphStyle(
        'TableCellBold',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=8.5,
        leading=11,
        textColor=c_text_dark
    )

    story = []

    # =========================================================================
    # PAGE 1: DEDICATED SYSTEM CREDENTIALS & ACCESS DIRECTORY
    # =========================================================================
    banner_data = [
        [Paragraph("🌿 KAWAIORA ARTISAN HAMPERS & ECO-LUXE GIFTS", style_doc_title)],
        [Paragraph("OFFICIAL SYSTEM CREDENTIALS & APPLICATION ARCHITECTURE MANUAL", style_doc_subtitle)]
    ]
    banner_table = Table(banner_data, colWidths=[540])
    banner_table.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,-1), c_slate_dark),
        ('TOPPADDING', (0,0), (-1,-1), 14),
        ('BOTTOMPADDING', (0,0), (-1,-1), 14),
        ('ALIGN', (0,0), (-1,-1), 'CENTER'),
        ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
        ('ROUNDEDCORNERS', [8, 8, 8, 8]),
    ]))
    story.append(banner_table)
    story.append(Spacer(1, 14))

    story.append(Paragraph("🔑 PAGE 1: OFFICIAL SYSTEM ACCESS & USER CREDENTIALS DIRECTORY", style_page_header))
    story.append(HRFlowable(width="100%", thickness=1.5, color=c_accent, spaceBefore=2, spaceAfter=10))

    story.append(Paragraph("This page contains confidential credentials for Concierge Admins and registered user accounts. Auto-fill login popups have been removed from the live site for maximum security.", style_body))
    story.append(Spacer(1, 10))

    story.append(Paragraph("Registered User & Admin Credentials Table", style_section_title))

    creds_headers = ["User ID", "Account Role", "Customer Name", "Login Email Address", "Password", "Access Privileges"]
    creds_rows = [
        [
            Paragraph("<b>#1</b>", style_td),
            Paragraph("<font color='#d4af37'><b>👑 Concierge Admin</b></font>", style_td),
            Paragraph("Admin Manager", style_td_bold),
            Paragraph("<code>admin@gifthampers.com</code>", style_td),
            Paragraph("<font color='#e11d48'><b>admin123</b></font>", style_td),
            Paragraph("Full Admin Management Center, Product Catalog, Stock Adjuster, Payment Gateways, Custom Promos", style_td)
        ],
        [
            Paragraph("<b>#2</b>", style_td),
            Paragraph("<b>🛍️ VIP Buyer</b>", style_td),
            Paragraph("Sarah Jenkins", style_td_bold),
            Paragraph("<code>sarah@example.com</code>", style_td),
            Paragraph("<font color='#10b981'><b>user123</b></font>", style_td),
            Paragraph("Catalog Shopping, Cart Checkout, Custom Hamper Designer, Wishlist, Order History", style_td)
        ],
        [
            Paragraph("<b>#3</b>", style_td),
            Paragraph("<b>🛍️ Corporate Client</b>", style_td),
            Paragraph("Daya Gupta", style_td_bold),
            Paragraph("<code>joihumai@gmail.com</code>", style_td),
            Paragraph("<font color='#10b981'><b>user123</b></font>", style_td),
            Paragraph("Bulk Corporate Orders, Mobile OTP Verified Checkout, QR Gift Message Link", style_td)
        ]
    ]

    table_data = [[Paragraph(h, style_th) for h in creds_headers]] + creds_rows
    table_creds = Table(table_data, colWidths=[40, 95, 80, 125, 65, 135])
    table_creds.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), c_slate_dark),
        ('ALIGN', (0,0), (-1,-1), 'LEFT'),
        ('VALIGN', (0,0), (-1,-1), 'TOP'),
        ('GRID', (0,0), (-1,-1), 0.5, colors.HexColor('#cbd5e1')),
        ('TOPPADDING', (0,0), (-1,-1), 6),
        ('BOTTOMPADDING', (0,0), (-1,-1), 6),
        ('ROWBACKGROUNDS', (0,1), (-1,-1), [colors.white, c_slate_light]),
    ]))
    story.append(table_creds)
    story.append(Spacer(1, 14))

    story.append(Paragraph("System Environment & Key Connection URLs", style_section_title))

    sys_urls = [
        [Paragraph("<b>Main E-Commerce Application URL</b>", style_td), Paragraph("<code>http://localhost:5000</code>", style_td)],
        [Paragraph("<b>Standalone Customer Credentials Directory</b>", style_td), Paragraph("<code>http://localhost:5000/admin/customers</code> (Admin Token Protected)", style_td)],
        [Paragraph("<b>Cloudinary Live Photo Engine</b>", style_td), Paragraph("Cloud Name: <code>daya6528</code> | API Key: <code>936128914954511</code>", style_td)],
        [Paragraph("<b>Merchant Payment UPI VPA</b>", style_td), Paragraph("<code>7686008@ybl</code> (Real-time Indian UPI & QR Payments)", style_td)],
        [Paragraph("<b>JWT Secret Key</b>", style_td), Paragraph("<code>gifthampers_secret_key_2026_super_secure</code>", style_td)],
        [Paragraph("<b>Database Engine</b>", style_td), Paragraph("SQLite 3 (<code>gifthampers.db</code>)", style_td)]
    ]
    table_sys = Table(sys_urls, colWidths=[200, 340])
    table_sys.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (0,-1), colors.HexColor('#f1f5f9')),
        ('GRID', (0,0), (-1,-1), 0.5, colors.HexColor('#cbd5e1')),
        ('TOPPADDING', (0,0), (-1,-1), 5),
        ('BOTTOMPADDING', (0,0), (-1,-1), 5),
    ]))
    story.append(table_sys)
    story.append(PageBreak())

    # =========================================================================
    # PAGE 2: STOREFRONT & ARTISAN HAMPERS CATALOG
    # =========================================================================
    story.append(Paragraph("🌿 PAGE 2: STOREFRONT & ARTISAN CATALOG OVERVIEW", style_page_header))
    story.append(HRFlowable(width="100%", thickness=1.5, color=c_accent, spaceBefore=2, spaceAfter=10))

    story.append(Paragraph("The storefront features botanical luxury branding with champagne gold accents, dynamic category filtering, real-time multi-currency conversions, and an interactive bespoke hamper builder.", style_body))
    story.append(Spacer(1, 10))

    story.append(Paragraph("Key E-Commerce Storefront Features", style_section_title))

    features_page2 = [
        [Paragraph("<b>1. Live Currency Converter Engine</b>", style_td_bold), Paragraph("Converts catalog prices live across <b>10 global currencies</b> (INR ₹, USD $, EUR €, GBP £, AED, CAD C$, AUD A$, JPY ¥, SGD S$, SAR) syncing with Open ER API rates.", style_td)],
        [Paragraph("<b>2. Artisan Hampers Catalog</b>", style_td_bold), Paragraph("Curated collection including Grand Royal Celebration ($149.99), Artisanal Chocolate & Wine ($119.50), Executive Corporate Crate ($189.00), Sweet Birthday Basket ($79.99), Zen Wellness Spa ($95.00), and Festive Sunshine ($85.50).", style_td)],
        [Paragraph("<b>3. Bespoke Custom Box Designer</b>", style_td_bold), Paragraph("Interactive 5-step builder allowing customers to choose custom boxes (Wicker Basket, Velvet Box, Wooden Crate), treats, beverages, keepsakes, and calligraphy greeting cards.", style_td)],
        [Paragraph("<b>4. Video/Audio QR Gift Message Link</b>", style_td_bold), Paragraph("Customers can attach YouTube/Vimeo/Drive links to print scanable QR codes directly on physical handwritten greeting notes.", style_td)],
        [Paragraph("<b>5. Delivery Time Slot & Ribbon Customization</b>", style_td_bold), Paragraph("Select Morning (9AM-12PM), Afternoon (1PM-5PM), or Evening Express (5PM-8PM) delivery slots paired with Eucalyptus Velvet or Gold Satin ribbons.", style_td)]
    ]
    t_f2 = Table(features_page2, colWidths=[180, 360])
    t_f2.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,-1), colors.white),
        ('GRID', (0,0), (-1,-1), 0.5, colors.HexColor('#cbd5e1')),
        ('TOPPADDING', (0,0), (-1,-1), 6),
        ('BOTTOMPADDING', (0,0), (-1,-1), 6),
        ('ROWBACKGROUNDS', (0,0), (-1,-1), [colors.white, c_slate_light]),
    ]))
    story.append(t_f2)
    story.append(Spacer(1, 12))

    story.append(Paragraph("Featured Hampers Summary Sample", style_section_title))
    hampers_sample = [
        ["Hamper Title", "Category", "Price (INR)", "Stock", "Included Items Summary"],
        ["Grand Royal Celebration", "Luxury", "₹12,499", "30 pcs", "Domaine Vintage Brut, Swiss Truffles 200g, Truffle Crackers, Soy Candle"],
        ["Artisanal Chocolate & Wine", "Romantic", "₹9,950", "25 pcs", "Napa Cabernet Sauvignon, Belgian Truffles 16pcs, Rose Tumbler, Card"],
        ["Executive Corporate Crate", "Corporate", "₹15,750", "40 pcs", "Glenfiddich 12yr Single Malt, Honey Macadamias, Leather Planner, Parker Pen"],
        ["Zen Wellness Spa Retreat", "Wellness", "₹7,915", "35 pcs", "Chamomile Tea, Mulberry Silk Sleep Mask, Eucalyptus Bath Salts, Diffuser"]
    ]
    t_hamp = Table([[Paragraph(c, style_th if i==0 else style_td) for c in row] for i, row in enumerate(hampers_sample)], colWidths=[130, 70, 75, 55, 210])
    t_hamp.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), c_slate_dark),
        ('GRID', (0,0), (-1,-1), 0.5, colors.HexColor('#cbd5e1')),
        ('TOPPADDING', (0,0), (-1,-1), 5),
        ('BOTTOMPADDING', (0,0), (-1,-1), 5),
        ('ROWBACKGROUNDS', (0,1), (-1,-1), [colors.white, c_slate_light]),
    ]))
    story.append(t_hamp)
    story.append(PageBreak())

    # =========================================================================
    # PAGE 3: ADMIN MANAGEMENT CENTER & LIVE PHOTO UPLOADER
    # =========================================================================
    story.append(Paragraph("🛡️ PAGE 3: ADMIN MANAGEMENT CENTER & LIVE PHOTO MANAGER", style_page_header))
    story.append(HRFlowable(width="100%", thickness=1.5, color=c_accent, spaceBefore=2, spaceAfter=10))

    story.append(Paragraph("The Admin Management Center equips store administrators with real-time KPI performance counters, order dispatch pipeline controls, and direct Cloudinary device photo uploads.", style_body))
    story.append(Spacer(1, 10))

    story.append(Paragraph("Admin Center Functional Highlights", style_section_title))

    admin_highlights = [
        [Paragraph("<b>1. Executive KPI Metrics Bar</b>", style_td_bold), Paragraph("Real-time telemetry tracking Total Sales Revenue, Order Volumes, Hampers Listed, and Registered Customer Accounts.", style_td)],
        [Paragraph("<b>2. Live Device & URL Photo Manager</b>", style_td_bold), Paragraph("Upload hamper images directly from local device to Cloudinary CDN or paste image URLs. Renders instant thumbnail preview grid with <b>#1 Cover</b> badge and 1-click removal.", style_td)],
        [Paragraph("<b>3. Order Status Pipeline Controls</b>", style_td_bold), Paragraph("Update order progression seamlessly through 5 stages: <code>Processing</code> &rarr; <code>Packed</code> &rarr; <code>Dispatched</code> &rarr; <code>Out for Delivery</code> &rarr; <code>Delivered</code>.", style_td)],
        [Paragraph("<b>4. Stock Adjustment Telemetry</b>", style_td_bold), Paragraph("Live stock quantity warnings triggering low inventory alerts for products with &le; 5 units.", style_td)]
    ]
    t_ah = Table(admin_highlights, colWidths=[180, 360])
    t_ah.setStyle(TableStyle([
        ('GRID', (0,0), (-1,-1), 0.5, colors.HexColor('#cbd5e1')),
        ('TOPPADDING', (0,0), (-1,-1), 6),
        ('BOTTOMPADDING', (0,0), (-1,-1), 6),
        ('ROWBACKGROUNDS', (0,0), (-1,-1), [colors.white, c_slate_light]),
    ]))
    story.append(t_ah)
    story.append(Spacer(1, 12))

    story.append(Paragraph("Hamper Photo Manager Architecture", style_section_title))
    photo_arch = [
        ["Step / Trigger", "System Process & Endpoint", "Result / Render Output"],
        ["Click 'Upload From Device'", "Triggers hidden file input `#modal-device-file-input`", "Opens native OS file chooser"],
        ["Select Image File", "POST `/api/admin/cloudinary/upload` (Bearer JWT)", "Uploads image to Cloudinary CDN"],
        ["CDN URL Generated", "Populates `.prod-photo-input` field", "Returns `https://res.cloudinary.com/...`"],
        ["Render Live Grid", "Executes `renderModalPhotoPreviews()`", "Displays thumbnail box with `#1 Cover` badge and `x` delete"]
    ]
    t_pa = Table([[Paragraph(c, style_th if i==0 else style_td) for c in row] for i, row in enumerate(photo_arch)], colWidths=[130, 200, 210])
    t_pa.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), c_slate_dark),
        ('GRID', (0,0), (-1,-1), 0.5, colors.HexColor('#cbd5e1')),
        ('TOPPADDING', (0,0), (-1,-1), 5),
        ('BOTTOMPADDING', (0,0), (-1,-1), 5),
        ('ROWBACKGROUNDS', (0,1), (-1,-1), [colors.white, c_slate_light]),
    ]))
    story.append(t_pa)
    story.append(PageBreak())

    # =========================================================================
    # PAGE 4: CUSTOM PROMO CODE GENERATOR & RULES ENGINE
    # =========================================================================
    story.append(Paragraph("🎟️ PAGE 4: CUSTOM PROMO CODE GENERATOR & RULES ENGINE", style_page_header))
    story.append(HRFlowable(width="100%", thickness=1.5, color=c_accent, spaceBefore=2, spaceAfter=10))

    story.append(Paragraph("The Custom Discounts Generator empowers admins to auto-generate or create tailored discount code rules with granular parameters and live cart validation.", style_body))
    story.append(Spacer(1, 10))

    story.append(Paragraph("Customization Parameters & Configuration Options", style_section_title))

    promo_params = [
        [Paragraph("<b>Auto-Generate Code</b>", style_td_bold), Paragraph("Click <b>'⚡ Auto-Generate Code'</b> to create random promo strings (e.g. <code>KAWAI-8F92</code>) or enter custom promo names.", style_td)],
        [Paragraph("<b>Discount Type</b>", style_td_bold), Paragraph("Toggle between <b>Percentage Off (%)</b> (e.g. 20% off) or <b>Fixed Amount Off (₹ / $)</b> (e.g. ₹500 fixed reduction).", style_td)],
        [Paragraph("<b>Minimum Spend Rule</b>", style_td_bold), Paragraph("Require cart subtotals to exceed a specified amount (e.g. Min spend ₹1,000) before code applies.", style_td)],
        [Paragraph("<b>Usage Limit Counter</b>", style_td_bold), Paragraph("Set maximum allowed redemptions (e.g. 50 total redemptions max) or set 0 for unlimited uses.", style_td)],
        [Paragraph("<b>Expiry Date Picker</b>", style_td_bold), Paragraph("Set exact expiration dates (<code>YYYY-MM-DD</code>). Expired codes are automatically rejected.", style_td)],
        [Paragraph("<b>Category Scope Targeting</b>", style_td_bold), Paragraph("Restrict codes to specific hamper categories (e.g. <code>Luxury</code>, <code>Corporate</code>, <code>Wellness</code>, or <code>All</code>).", style_td)]
    ]
    t_pp = Table(promo_params, colWidths=[160, 380])
    t_pp.setStyle(TableStyle([
        ('GRID', (0,0), (-1,-1), 0.5, colors.HexColor('#cbd5e1')),
        ('TOPPADDING', (0,0), (-1,-1), 5),
        ('BOTTOMPADDING', (0,0), (-1,-1), 5),
        ('ROWBACKGROUNDS', (0,0), (-1,-1), [colors.white, c_slate_light]),
    ]))
    story.append(t_pp)
    story.append(Spacer(1, 12))

    story.append(Paragraph("Active System Promo Codes Directory Sample", style_section_title))
    promo_sample = [
        ["Code", "Type", "Discount Value", "Min Spend", "Uses Limit", "Expiry Date", "Category Scope", "Status"],
        ["WELCOME10", "Percentage", "10% OFF", "₹0.00", "Unlimited (3 used)", "Never", "All Hampers", "Active"],
        ["FESTIVE25", "Percentage", "25% OFF", "₹1,000.00", "100 (12 used)", "2026-12-31", "All Hampers", "Active"],
        ["LUXURY500", "Fixed Amount", "₹500.00 OFF", "₹2,500.00", "50 (2 used)", "2026-11-30", "Luxury", "Active"],
        ["KAWAI-98A2", "Percentage", "15% OFF", "₹500.00", "20 (0 used)", "2026-10-15", "Corporate", "Active"]
    ]
    t_pms = Table([[Paragraph(c, style_th if i==0 else style_td) for c in row] for i, row in enumerate(promo_sample)], colWidths=[75, 70, 75, 65, 80, 65, 65, 45])
    t_pms.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), c_slate_dark),
        ('GRID', (0,0), (-1,-1), 0.5, colors.HexColor('#cbd5e1')),
        ('TOPPADDING', (0,0), (-1,-1), 5),
        ('BOTTOMPADDING', (0,0), (-1,-1), 5),
        ('ROWBACKGROUNDS', (0,1), (-1,-1), [colors.white, c_slate_light]),
    ]))
    story.append(t_pms)
    story.append(PageBreak())

    # =========================================================================
    # PAGE 5: STANDALONE CUSTOMER CREDENTIALS DIRECTORY (/admin/customers)
    # =========================================================================
    story.append(Paragraph("👥 PAGE 5: CUSTOMER CREDENTIALS DIRECTORY PORTAL", style_page_header))
    story.append(HRFlowable(width="100%", thickness=1.5, color=c_accent, spaceBefore=2, spaceAfter=10))

    story.append(Paragraph("The Customer Directory portal at <code>http://localhost:5000/admin/customers</code> provides concierge admins with real-time authentication logs, credential security encryption status, and account controls.", style_body))
    story.append(Spacer(1, 10))

    story.append(Paragraph("Security Guard & Admin Control System", style_section_title))

    dir_controls = [
        [Paragraph("<b>Strict Token & Role Enforcement</b>", style_td_bold), Paragraph("Protected by <code>@token_required</code> and <code>@admin_required</code> decorators. Unauthenticated users visiting <code>/admin/customers</code> are blocked with an HTTP 401 response and an Access Denied guard.", style_td)],
        [Paragraph("<b>Credentials Security View</b>", style_td_bold), Paragraph("Displays SHA-256 hashed password statuses (e.g. <code>SHA-256 (8cc88546...d5e5)</code>), Auth provider types (Email/Password), and Mobile OTP verification states.", style_td)],
        [Paragraph("<b>🔑 Password Reset Control</b>", style_td_bold), Paragraph("Admins can trigger force password resets for any customer account via an interactive modal (`PUT /api/admin/users/<id>/reset-password`).", style_td)],
        [Paragraph("<b>👑 Role Elevation Toggle</b>", style_td_bold), Paragraph("Promote registered customers to Concierge Admin or demote accounts with instant audit logging (`PUT /api/admin/users/<id>/role`).", style_td)],
        [Paragraph("<b>🗑️ Customer Account Removal</b>", style_td_bold), Paragraph("Safely remove customer accounts from the database (`DELETE /api/admin/users/<id>`).", style_td)]
    ]
    t_dc = Table(dir_controls, colWidths=[170, 370])
    t_dc.setStyle(TableStyle([
        ('GRID', (0,0), (-1,-1), 0.5, colors.HexColor('#cbd5e1')),
        ('TOPPADDING', (0,0), (-1,-1), 6),
        ('BOTTOMPADDING', (0,0), (-1,-1), 6),
        ('ROWBACKGROUNDS', (0,0), (-1,-1), [colors.white, c_slate_light]),
    ]))
    story.append(t_dc)
    story.append(Spacer(1, 12))

    story.append(Paragraph("Customer Credentials Database Records Sample", style_section_title))
    cust_sample = [
        ["ID", "Customer Name", "Email Address", "Security Credential Status", "Role", "Orders", "Lifetime Spend"],
        ["#1", "Admin Manager", "admin@gifthampers.com", "SHA-256 Hash + JWT Token", "👑 Concierge Admin", "0 Orders", "₹0.00"],
        ["#2", "Sarah Jenkins", "sarah@example.com", "SHA-256 (e606e38b...4446)", "🛍️ Customer", "1 Orders", "₹3,361.50"],
        ["#3", "Daya Gupta", "joihumai@gmail.com", "SHA-256 (8cc88546...d5e5)", "🛍️ Customer", "1 Orders", "₹1,494.00"]
    ]
    t_cs = Table([[Paragraph(c, style_th if i==0 else style_td) for c in row] for i, row in enumerate(cust_sample)], colWidths=[35, 95, 130, 140, 80, 50, 70])
    t_cs.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), c_slate_dark),
        ('GRID', (0,0), (-1,-1), 0.5, colors.HexColor('#cbd5e1')),
        ('TOPPADDING', (0,0), (-1,-1), 5),
        ('BOTTOMPADDING', (0,0), (-1,-1), 5),
        ('ROWBACKGROUNDS', (0,1), (-1,-1), [colors.white, c_slate_light]),
    ]))
    story.append(t_cs)
    story.append(PageBreak())

    # =========================================================================
    # PAGE 6: LIVE PAYMENT GATEWAYS & SYSTEM ARCHITECTURE
    # =========================================================================
    story.append(Paragraph("💳 PAGE 6: PAYMENT GATEWAYS & SYSTEM ARCHITECTURE", style_page_header))
    story.append(HRFlowable(width="100%", thickness=1.5, color=c_accent, spaceBefore=2, spaceAfter=10))

    story.append(Paragraph("KawaiOra Artisan Hampers provides dual payment processing engines for seamless Indian UPI/QR payments and global credit/debit card transactions.", style_body))
    story.append(Spacer(1, 10))

    story.append(Paragraph("Payment Processing & Gateway Credentials Architecture", style_section_title))

    payment_arch = [
        [Paragraph("<b>1. Indian Merchant UPI & QR Payments</b>", style_td_bold), Paragraph("Integrated VPA <code>7686008@ybl</code> with dynamic real-time UPI QR Code generation and 1-click app links for PhonePe, Paytm, and Google Pay.", style_td)],
        [Paragraph("<b>2. Stripe Global Credit & Debit Cards</b>", style_td_bold), Paragraph("Supports 256-bit SSL encrypted global credit/debit checkout powered by Stripe API (Sandbox / Production keys configured via Live Gateways Manager).", style_td)],
        [Paragraph("<b>3. Razorpay / PhonePe Integration</b>", style_td_bold), Paragraph("Configurable Razorpay Key ID & Key Secret for automated webhooks and instant payment verification.", style_td)],
        [Paragraph("<b>4. Mobile OTP Security Audit DB</b>", style_td_bold), Paragraph("Active Mobile OTP database logging customer authentication verification timestamps and session integrity.", style_td)]
    ]
    t_pa_arch = Table(payment_arch, colWidths=[180, 360])
    t_pa_arch.setStyle(TableStyle([
        ('GRID', (0,0), (-1,-1), 0.5, colors.HexColor('#cbd5e1')),
        ('TOPPADDING', (0,0), (-1,-1), 6),
        ('BOTTOMPADDING', (0,0), (-1,-1), 6),
        ('ROWBACKGROUNDS', (0,0), (-1,-1), [colors.white, c_slate_light]),
    ]))
    story.append(t_pa_arch)
    story.append(Spacer(1, 14))

    story.append(Paragraph("Application REST API Endpoint Reference Map", style_section_title))
    api_map = [
        ["HTTP Method", "API Route", "Authentication Scope", "Description / Functionality"],
        ["GET", "/api/products", "Public", "Fetch hamper catalog with search, category, and sorting"],
        ["POST", "/api/products", "Admin Token", "Create hamper product with multi-photo image arrays"],
        ["PUT", "/api/products/<id>/stock", "Admin Token", "Update product stock units or delta adjustment"],
        ["GET / POST", "/api/admin/discounts", "Admin Token", "List, create, toggle, or delete custom promo rules"],
        ["POST", "/api/discounts/validate", "Public", "Validate promo code against cart subtotal & rules"],
        ["GET", "/api/admin/users", "Admin Token", "Fetch registered customer credentials directory"],
        ["PUT", "/api/admin/users/<id>/reset-password", "Admin Token", "Admin force password reset for customer account"],
        ["POST", "/api/orders", "Public / User Token", "Place new customer order with tracking number"]
    ]
    t_am = Table([[Paragraph(c, style_th if i==0 else style_td) for c in row] for i, row in enumerate(api_map)], colWidths=[70, 130, 110, 230])
    t_am.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), c_slate_dark),
        ('GRID', (0,0), (-1,-1), 0.5, colors.HexColor('#cbd5e1')),
        ('TOPPADDING', (0,0), (-1,-1), 5),
        ('BOTTOMPADDING', (0,0), (-1,-1), 5),
        ('ROWBACKGROUNDS', (0,1), (-1,-1), [colors.white, c_slate_light]),
    ]))
    story.append(t_am)

    doc.build(story)
    print(f"✨ PDF Documentation generated successfully at: {pdf_filename}")

if __name__ == '__main__':
    build_pdf()
