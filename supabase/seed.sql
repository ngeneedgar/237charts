-- 237 Charts — seed data

insert into genres (slug, name_en, name_fr, sort_order) values
  ('makossa', 'Makossa',             'Makossa',             1),
  ('bikutsi', 'Bikutsi',             'Bikutsi',             2),
  ('mbole',   'Mbolé',               'Mbolé',               3),
  ('njang',   'Njang',               'Njang',               4),
  ('afro',    'Afrobeats & Afropop', 'Afrobeats & Afropop', 5),
  ('hiphop',  'Hip Hop & Dancehall', 'Hip-hop & Dancehall', 6),
  ('mboko',   'Mboko',               'Mboko',               7),
  ('gospel',  'Gospel',              'Gospel',              8)
on conflict (slug) do nothing;

insert into methodology_versions
  (version, effective_from, weights_with_spotify, weights_without_spotify, notes_en, notes_fr)
values (
  'v1.0', '2026-11-16',
  '{"youtube":0.4,"audiomack":0.25,"shazam":0.2,"deezer":0.15}',   -- with Audiomack
  '{"youtube":0.5,"shazam":0.25,"deezer":0.25}',                    -- current
  'Score = 10,000 × Σ (platform weight × song share of platform total). Sources and weights: YouTube views this week 50%, position in Shazam''s Cameroon chart 25%, popularity on Deezer 25%. Shazam publishes a ranking, not play counts, so a song earns more the higher it sits in Shazam''s Cameroon Top 200. If a source is unavailable in a given week, the other weights are rescaled. Eligible artists are Cameroonian (by nationality); artists of Cameroonian descent who are not Cameroonian nationals are not eligible, nor are artists who also hold another nationality. A channel registered outside Cameroon does not affect eligibility. Official channels only. A song''s release date is the earliest date it is known to exist (first YouTube upload of any official version, or its earliest release on Deezer, compilations included); re-uploads never reset it. 104-week eligibility window; songs older than 52 weeks become recurrent and stay on the Overall chart only while in the top 25. A weekly count above 5× the song''s 4-week median (and at least 5,000) is capped at 3× and labelled "Adjusted for irregular activity". Genre charts: eight Top 20s (Makossa, Bikutsi, Mbolé, Njang, Afrobeats & Afropop, Hip Hop & Dancehall, Mboko, Gospel) using the same scores; each artist has a main genre that a song keeps unless its title or the team places it elsewhere. Viral 20: only songs released in the last 8 weeks (unknown date not eligible); score = 50% YouTube view growth (this week minus last week) + 50% Shazam Cameroon position; newness multiplier 1.0 for weeks 0–2, then 10% less per week to 0.4 at week 8.',
  'Score = 10 000 × Σ (poids de la plateforme × part du titre sur la plateforme). Sources et poids : vues YouTube de la semaine 50 %, position dans le classement Shazam Cameroun 25 %, popularité sur Deezer 25 %. Shazam publie un classement et non des nombres d''écoutes : plus un titre est haut dans le Top 200 Shazam Cameroun, plus il rapporte. Si une source est indisponible une semaine, les autres poids sont réajustés. Sont éligibles les artistes camerounais (par la nationalité) ; les artistes d''origine camerounaise sans la nationalité camerounaise ne sont pas éligibles, ni les artistes qui ont aussi une autre nationalité. Une chaîne enregistrée hors du Cameroun n''affecte pas l''éligibilité. Chaînes officielles uniquement. La date de sortie d''un titre est la plus ancienne date connue de son existence (première mise en ligne YouTube d''une version officielle, ou sa plus ancienne sortie sur Deezer, compilations comprises) ; une nouvelle mise en ligne ne la remet jamais à zéro. Fenêtre d''éligibilité de 104 semaines ; au-delà de 52 semaines, un titre devient récurrent et ne reste au classement général que s''il est dans le top 25. Un total hebdomadaire supérieur à 5× la médiane des 4 dernières semaines (et d''au moins 5 000) est plafonné à 3× et signalé « Ajusté pour activité irrégulière ». Classements par genre : huit Top 20 (Makossa, Bikutsi, Mbolé, Njang, Afrobeats & Afropop, Hip-hop & Dancehall, Mboko, Gospel) avec les mêmes scores ; chaque artiste a un genre principal qu''un titre conserve sauf si son intitulé ou l''équipe le classe ailleurs. Viral 20 : seuls les titres sortis au cours des 8 dernières semaines (date inconnue non éligible) ; score = 50 % croissance des vues YouTube (cette semaine moins la précédente) + 50 % position Shazam Cameroun ; multiplicateur de nouveauté 1,0 les semaines 0 à 2, puis 10 % de moins par semaine jusqu''à 0,4 en semaine 8.'
)
on conflict (version) do nothing;
