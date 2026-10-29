import { createClient } from
  'https://esm.sh/@supabase/supabase-js@2';

const supabaseUrl =
  'https://uxjmgxafbxjnypkokhxh.supabase.co';

const supabasePublishableKey =
  'sb_publishable_nwXdwY4f_qt2-ZsMt42Wdg_-ZAsDIv7';

export const supabase = createClient(
  supabaseUrl,
  supabasePublishableKey
);
