export type SMTPErrorCategory = 'AUTH_ERROR' | 'RATE_LIMIT' | 'INVALID_RECIPIENT' | 'CONNECTION' | 'UNKNOWN';

export interface SMTPDiagnosis {
  category: SMTPErrorCategory;
  categoryLabelBn: string;
  categoryLabelEn: string;
  severity: 'CRITICAL' | 'WARNING' | 'INFO';
  explanationBn: string;
  explanationEn: string;
  possibleCausesBn: string[];
  possibleCausesEn: string[];
  recommendationsBn: string[];
  recommendationsEn: string[];
}

/**
 * Analyzes SMTP / Nodemailer error traces to categorize the error type and provide detailed insights.
 */
export function diagnoseSMTPError(errorStr: string | null | undefined): SMTPDiagnosis {
  if (!errorStr) {
    return {
      category: 'UNKNOWN',
      categoryLabelBn: 'শ্রেণীবিভাগহীন সমস্যা',
      categoryLabelEn: 'Unknown Issue',
      severity: 'INFO',
      explanationBn: 'কোনো ত্রুটিবার্তা খুঁজে পাওয়া যায়নি। সম্ভবত মেইলটি সফল হয়েছে অথবা লগ রেকর্ডটি অপূর্ণাঙ্গ।',
      explanationEn: 'No detailed error message was found. The email may have succeeded, or the log record is incomplete.',
      possibleCausesBn: ['কোনো বাহ্যিক ত্রুটি নথিভুক্ত হয়নি।'],
      possibleCausesEn: ['No external error details captured.'],
      recommendationsBn: ['ইমেইল লগ রিফ্রেশ করে পুনরায় পরীক্ষা করুন।'],
      recommendationsEn: ['Refresh the email logs and inspect again.']
    };
  }

  const err = errorStr.toLowerCase();

  // 1. AUTHENTICATION ERRORS
  if (
    err.includes('535') || 
    err.includes('invalid login') || 
    err.includes('username and password not accepted') || 
    err.includes('app_password') || 
    err.includes('credentials') || 
    err.includes('auth') || 
    err.includes('password not accepted') ||
    err.includes('bad credentials')
  ) {
    return {
      category: 'AUTH_ERROR',
      categoryLabelBn: '🔑 ক্রেডেনশিয়াল / অথেনটিকেশন ত্রুটি (Authentication Error)',
      categoryLabelEn: '🔑 Credentials & Authentication Error',
      severity: 'CRITICAL',
      explanationBn: 'আপনার জিমেইল একাউন্টের নাম (GMAIL_USER) অথবা জিমেইল অ্যাপ পাসওয়ার্ড (GMAIL_APP_PASSWORD) জিমেইল সার্ভার কর্তৃক প্রত্যাখ্যান করা হয়েছে। জিমেইল সিকিউরিটি পলিসি সাধারণ পাসওয়ার্ড ব্যবহারের অনুমতি দেয় না, অবশ্যই একটি সঠিক "১৬ অক্ষরের অ্যাপ পাসওয়ার্ড" ব্যবহার করতে হবে।',
      explanationEn: 'Your Gmail email address (GMAIL_USER) or the Gmail App Password (GMAIL_APP_PASSWORD) was rejected by the Gmail SMTP server. Gmail requires a valid 16-character App Password generated from your Google Account Security dashboard.',
      possibleCausesBn: [
        'ভুল বা মেয়াদোত্তীর্ণ জিমেইল অ্যাপ পাসওয়ার্ড (১৬ অক্ষরের কোড) ব্যবহার করা হচ্ছে।',
        'ভুল ইমেইল এড্রেস প্রদান করা হয়েছে অথবা .env ফাইলে স্পেস রয়েছে।',
        'একাউন্টের "2-Step Verification" অপশনটি বন্ধ করা হয়েছে যার ফলে অ্যাপ পাসওয়ার্ডটি নিষ্ক্রিয় হয়ে গেছে।'
      ],
      possibleCausesEn: [
        'Incorrect or expired 16-character Google App Password.',
        'Typo in the GMAIL_USER email address or trailing spaces in the environment config.',
        'Google 2-Step Verification was disabled, inactivating all existing App Passwords.'
      ],
      recommendationsBn: [
        'আপনার জিমেইল গুগল একাউন্ট সিকিউরিটি সেটিংসে যান এবং একটি নতুন App Password তৈরি করুন।',
        'AI Studio Settings বা .env ফাইলের GMAIL_APP_PASSWORD পরিবর্তন করে নতুন কোডটি বসান (কোনো স্পেস রাখবেন না)।',
        'GMAIL_USER ঠিকানার স্পেলিং সম্পূর্ণ সঠিক আছে কিনা পুনরায় মেলাবেন।'
      ],
      recommendationsEn: [
        'Go to your Google Account Account Security tab and generate a fresh 16-character App Password.',
        'Update GMAIL_APP_PASSWORD in your AI Studio settings / .env file with the new password, ensuring no trailing spaces remain.',
        'Verify GMAIL_USER carefully for any character typos.'
      ]
    };
  }

  // 2. RATE LIMIT / REJECTED SPAM / THROTTLED
  if (
    err.includes('450') || 
    err.includes('454') || 
    err.includes('421') || 
    err.includes('limit') || 
    err.includes('rate') || 
    err.includes('too many') || 
    err.includes('throttl') || 
    err.includes('exceeded') || 
    err.includes('spam') || 
    err.includes('suspicion') ||
    err.includes('block')
  ) {
    return {
      category: 'RATE_LIMIT',
      categoryLabelBn: '⏳ ইমেইল পাঠানোর সীমা অতিক্রম / ব্লক (Rate Limit & Throttling)',
      categoryLabelEn: '⏳ Sending Rate Limit & Throttling',
      severity: 'WARNING',
      explanationBn: 'জিমেইল সার্ভার আপনার অ্যাকাউন্ট থেকে অতিরিক্ত সংখ্যক মেইল পাঠানোর কারণে অথবা মেইলের কনটেন্ট স্প্যাম হিসেবে সন্দেহ হওয়ায় মেইল পাঠানো সাময়িকভাবে নিষ্ক্রিয় বা থ্রটল করেছে। সাধারণ জিমেইল একাউন্ট থেকে প্রতিদিন সর্বোচ্চ ৫০০টি ইমেইল পাঠানো যায়।',
      explanationEn: 'The Gmail SMTP server temporarily deferred or blocked sending because of rate limit caps (standard accounts allow up to 500 emails/day) or on suspicion of spam-like email behavior.',
      possibleCausesBn: [
        'আপনার জিমেইল অ্যাকাউন্ট থেকে গত ২৪ ঘণ্টায় ৫০০টির বেশি ইমেইল পাঠানো হয়েছে।',
        'একটানা অতি দ্রুত অনেকগুলো ইমেইল পাঠানো হয়েছে যা বট আচরণ হিসেবে চিহ্নিত হয়েছে।',
        'ইমেইলের টেক্সট বা সাবজেক্টে অতিরিক্ত স্প্যাম বা সন্দেহজনক মার্কেটিং লিংক রয়েছে।'
      ],
      possibleCausesEn: [
        'Your SMTP sending cap (500 emails/day for free Gmail accounts) has been reached.',
        'High-velocity bulk email bursts caused the anti-abuse defenses to trigger.',
        'The email body template looks repetitive or suspicious, matching Google spam filters.'
      ],
      recommendationsBn: [
        'পরবর্তী ২৪ ঘণ্টার জন্য নতুন ইমেইল পাঠানো বন্ধ রাখুন বা অপেক্ষা করুন যেন কোটা রিসেট হয়।',
        'অফিসিয়াল কাজের জন্য Google Workspace (Paid Business-grade G Suite) ব্যবহারের কথা বিবেচনা করুন যার সীমা প্রতিদিন ২০০০টি মেইল।',
        'একসাথে সব মেইল সেন্ড না করে মাঝে কয়েক সেকেন্ডের টাইমআউট বিরতি ব্যবহার করুন।'
      ],
      recommendationsEn: [
        'Wait up to 24 hours for Google to lift the sending block and reset your daily quota.',
        'Consider upgrading to a Google Workspace paid account for a higher daily throughput (2,000/day).',
        'Introduce small delays (throttling) between bulk email transmissions to mimic authentic human cadence.'
      ]
    };
  }

  // 3. INVALID RECIPIENT ADDRESS / MAILBOX REJECTED
  if (
    err.includes('550') || 
    err.includes('553') || 
    err.includes('5.1.1') || 
    err.includes('recipient address rejected') || 
    err.includes('does not exist') || 
    err.includes('invalid address') || 
    err.includes('mailbox not found') || 
    err.includes('no such user') || 
    err.includes('user not found') ||
    err.includes('invalid recipient') ||
    err.includes('not a valid')
  ) {
    return {
      category: 'INVALID_RECIPIENT',
      categoryLabelBn: '📬 অকার্যকর বা ভুয়া গ্রাহক ইমেইল (Invalid Recipient Mailbox)',
      categoryLabelEn: '📬 Invalid Recipient Mailbox Error',
      severity: 'WARNING',
      explanationBn: 'গ্রাহকের ইমেইল ঠিকানাটি খুঁজে পাওয়া যায়নি অথবা তা অকার্যকর। ছাত্র-ছাত্রীরা রেজিস্ট্রেশন করার সময় প্রায়শই ভুল ডোমেইন সাইন বা টাইপো এড্রেস (যেমন: @gamil.com বা @yaho.com) দেওয়ার কারণে এই সমস্যাটি ঘটে।',
      explanationEn: 'The recipient email address does not exist or has been suspended. This frequently happens if students sign up with typographical domain mistakes (e.g., @gamil.com instead of @gmail.com) or inactive addresses.',
      possibleCausesBn: [
        'শিক্ষার্থী লাইব্রেরিতে একাউন্ট বানানোর সময় ভুল ক্যারেক্টার ইনপুট করেছে।',
        'ইমেইল ডোমেইনে স্পেলিং ভুল রয়েছে (যেমন: mbstu.ac.bd এর জায়গায় mbstu.ac.bddd)।',
        'গ্রাহকের স্টোরেজ ফুল অথবা অ্যাকাউন্ট অনেকদিন ধরে সাময়িকভাবে বন্ধ আছে।'
      ],
      possibleCausesEn: [
        'Typographical error entered by the user during enrollment/checkout.',
        'The target email address domain is invalid or misspelled.',
        'The recipient email box is full, suspended, or completely deleted.'
      ],
      recommendationsBn: [
        'এই শিক্ষার্থীর নাম ও মোবাইল নাম্বার খুঁজে বের করে তার ইমেইলটি সংশোধন করুন।',
        'ইমেইল লগস থেকে লাল ডাস্টবিন আইকন বা অ্যাকাউন্ট ডিলিট বাটন দিয়ে ডাটাবেজ থেকে অকেজো অ্যাকাউন্টটি মুছে ফেলুন যাতে পরবর্তীতে ডাস্টবিল্ড মেইল জিমেইল ব্লক না করে।',
        'রেজিস্ট্রেশন পেইজে রিয়েল-টাইম ইমেইল ফরম্যাট যাচাইকরণ কড়াকড়ি করুন।'
      ],
      recommendationsEn: [
        'Contact the student to get their valid Gmail address and update it in their profile.',
        'Remove or delete this fake registration from your database using the red action buttons, protecting your SMTP server reputational integrity tracker.',
        'Enforce strict regex validator controls on the sign-up and checkout forms.'
      ]
    };
  }

  // 4. CONNECTION / PORT / NETWORK TIMEOUT
  if (
    err.includes('timeout') || 
    err.includes('etimedout') || 
    err.includes('econnrefused') || 
    err.includes('enotfound') || 
    err.includes('network') || 
    err.includes('dns') || 
    err.includes('connect') || 
    err.includes('port') ||
    err.includes('tls') ||
    err.includes('ssl')
  ) {
    return {
      category: 'CONNECTION',
      categoryLabelBn: '🌐 সার্ভার সংযোগ / নেটওয়ার্ক ত্রুটি (SMTP Connection Issues)',
      categoryLabelEn: '🌐 SMTP Server Network / Connection Issues',
      severity: 'CRITICAL',
      explanationBn: 'ইমেইল সার্ভার (smtp.gmail.com) এর সাথে সফল নেটওয়ার্ক টিএলএস সুড়ঙ্গ স্থাপন করা যায়নি। এর কারণ হতে পারে হোস্ট ও পোর্টের ডিক্লেয়ারেশন অমিল, প্রক্সি ব্লক, ফায়ারওয়াল বা ইন্টারনেট সংযোগ বিপর্যয়।',
      explanationEn: 'The app backend failed to open a secure TLS/SSL socket tunnel with smtp.gmail.com on port 465. This can be caused by firewall filters, system routing proxies, DNS failures, or offline remote servers.',
      possibleCausesBn: [
        'ক্লাউড কন্টেইনার সংযোগকালে আইপি ব্লক অথবা ফায়ারওয়াল বাধা সৃষ্টি করেছে।',
        'smtp.gmail.com এবং পোর্ট ৪৬৫ রিজলভ করতে ডিএনএস ডেকোরেশনে জটিলতা হয়েছে।',
        'সার্ভার কনফিগারেশনে Node.js ট্রাস্ট-সার্টিফিকেট সিকিউরিটি পলিসির বিচ্যুতি।'
      ],
      possibleCausesEn: [
        'Network firewall blocks outgoing traffic on SMTP port 465.',
        'Intermittent cloud infrastructure DNS outages preventing host resolution.',
        'Node.js SSL context validation issues with expired root certificates.'
      ],
      recommendationsBn: [
        'ডায়াগনস্টিক টেস্টিং প্যানেলের মাধ্যমে লাইভ কানেকশন টেস্ট রান করে পোর্ট ৪৬৫ এর রেসপন্স দেখুন।',
        'প্রয়োজনে সার্ভার কোডবুক থেকে ট্রান্সপোর্ট পোর্ট পরিবর্তন (যেমন: পোর্ট ৫৮৭ + STARTTLS) করার সমাধান চেষ্টা করতে পারেন।',
        'AI Studio-তে ডেভলপমেন্ট সার্ভারটি একবার রিস্টার্ট করুন।'
      ],
      recommendationsEn: [
        'Run the SMTP Live Diagnostics test to check if port 465 is reachable from the current container host.',
        'Try changing port configurations in server and api routes, switching to Port 587 with opportunistic TLS (STARTTLS).',
        'Restart the dev server from the settings/controls panel to reload caching layers.'
      ]
    };
  }

  // 5. OTHER / UNKNOWN
  return {
    category: 'UNKNOWN',
    categoryLabelBn: '❓ অন্যান্য অনির্ধারিত ত্রুটি (Unclassified Server Error)',
    categoryLabelEn: '❓ Unclassified Server Error',
    severity: 'INFO',
    explanationBn: 'জিমেইল সার্ভার থেকে প্রাপ্ত ইরর মেসেজটি ইউনিক বা অপ্রচলিত শ্রেণীর। নিচের র-কোড দেখে বিষয়টি সনাক্ত করুন।',
    explanationEn: 'An uncommon error message was received from the SMTP server. See the raw code details representation in the inspect window.',
    possibleCausesBn: [
      'ব্যক্তিগত জিমেইল সেটিংসের কিছু বাহ্যিক বাধ্যবাধকতা।',
      'সার্ভার পিলারের কোনো অভ্যন্তরীণ এপিআই কোড রিজেকশন।'
    ],
    possibleCausesEn: [
      'Nodemailer client configurations mismatched during parsing.',
      'Unusual transient error response code returned by Google.'
    ],
    recommendationsBn: [
      'পার্সড ডট জেএসএন ফাইলের স্ট্যাকট্রেস বিস্তারিত লক্ষ্য করে গুগল ডকের সার্চ ব্যবহার করুন।',
      'প্রয়োজনে ইমেইটি ম্যানুয়ালি পুনরায় পাঠিয়ে টেস্ট করুন।'
    ],
    recommendationsEn: [
      'Examine the raw error string block details and query developer engines.',
      'Try triggering a minor email retry test to isolate transient server errors.'
    ]
  };
}

/**
 * Aggregates logs and breaks them down by categories for charts or summary cards.
 */
export function aggregateSMTPLogs(logs: { status: string; errorDetails?: string }[]) {
  const failed = logs.filter(l => l.status === 'failed');
  
  let authCount = 0;
  let rateLimitCount = 0;
  let invalidRecipientCount = 0;
  let connectionCount = 0;
  let unknownCount = 0;

  failed.forEach(log => {
    const diagnosis = diagnoseSMTPError(log.errorDetails);
    if (diagnosis.category === 'AUTH_ERROR') authCount++;
    else if (diagnosis.category === 'RATE_LIMIT') rateLimitCount++;
    else if (diagnosis.category === 'INVALID_RECIPIENT') invalidRecipientCount++;
    else if (diagnosis.category === 'CONNECTION') connectionCount++;
    else unknownCount++;
  });

  return {
    totalFailed: failed.length,
    auth: authCount,
    rateLimit: rateLimitCount,
    invalidRecipient: invalidRecipientCount,
    connection: connectionCount,
    unknown: unknownCount
  };
}
