<?php
/**
 * Copy this file to "config.php" (same folder) and fill in your details.
 * config.php is git-ignored, so your API key stays private.
 *
 * Get a free API key at https://resend.com  ->  API Keys.
 */
return [
    // Your Resend API key, e.g. 're_xxxxxxxxxxxxxxxxxxxx'
    'resend_api_key' => 'PASTE_YOUR_RESEND_API_KEY_HERE',

    // Where quote enquiries should land. Use the inbox you actually check.
    'mail_to' => 'info@ozzystrees.com.au',

    // Who the email appears to come from.
    // BEFORE verifying your domain in Resend, use the test sender below
    // (it only delivers to your Resend account email):
    //   'mail_from' => "Ozzy's Website <onboarding@resend.dev>",
    // AFTER verifying ozzystrees.com.au in Resend, switch to your own domain:
    //   'mail_from' => "Ozzy's Website <quote@ozzystrees.com.au>",
    'mail_from' => "Ozzy's Website <onboarding@resend.dev>",
];
