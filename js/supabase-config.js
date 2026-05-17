// ========================================================
// VYAPARK SUPABASE CONFIGURATION
// ========================================================

const SUPABASE_URL = "https://pokivjbcpcyyrmcfmqta.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_u2QdIiuQB6FVQqemK_mXPw_DgUfm1Ic";

// Initialize Supabase Client and assign to global variable
window.supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Cloudinary Configuration
window.CLOUDINARY_CLOUD_NAME = "dmj4hvj80";
window.CLOUDINARY_UPLOAD_PRESET = "uw-upload-preset";

console.log("Vyapark Supabase & Cloudinary Config Initialized Successfully!");
