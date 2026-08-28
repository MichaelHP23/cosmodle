# Advertising

There is one ad slot, below the guess table and above the footer. It is off by default and stays off
until the environment variables in `.env.example` are filled in, so a build without them contains no
Google script, makes no ad request, and renders the slot as an empty reserved box.

The two variables are set at different points, because AdSense issues the publisher id at sign-up
but the ad unit only exists after the site is approved:

1. On sign-up, set `VITE_ADSENSE_CLIENT` to the publisher id, `ca-pub-` plus sixteen digits, and
   redeploy. That puts the tag in the page and publishes `ads.txt`, which is how Google verifies the
   site for review. With no `VITE_ADSENSE_SLOT` yet, nothing renders and no ad is requested.
2. On approval, create a display ad unit and set `VITE_ADSENSE_SLOT` to its id; ads start serving
   on the next deploy.

Both variables have to be set as build environment variables on the Cloudflare Pages project, not
only in a local `.env`, since they are baked in at build time rather than read by the browser. The
ad unit id isn't a secret, but it stays out of this source tree rather than defaulting there.

Consent is handled by Google Funding Choices, Google's own certified CMP, which the app loads for the
same publisher id just before the AdSense tag. It is configured in the AdSense UI (Privacy and
messaging), not in this repository, so the message text, regions, and vendor list are changed there
and take effect without a deploy. There is deliberately no second cookie banner in the app, and the
app stores no consent record of its own.

The reserved height of the slot exists before anything loads and does not change when an ad arrives,
so enabling advertising causes no layout shift.
