-- ============================================================================
-- SportsWeb One — DEMO CLUBS (all 13, one per template). ONE file, safe to re-run.
-- Uses plain INSERT..VALUES so enum columns (status, sport_type, etc.) cast cleanly.
-- Creates each club if missing, then (re)seeds its content.
-- View:  /?club=<slug>&variant=<variant>     (?club=reset to exit)
--
--   Northside Lions FC             /?club=northside-lions&variant=leaguefooty
--   Eastside United SC             /?club=eastside-united&variant=pitch
--   Riverside Cricket Club         /?club=riverside-cricket&variant=scorecard
--   Parkville Netball Club         /?club=parkville-netball&variant=courtside
--   Metro City Basketball          /?club=metro-city-basketball&variant=hardcourt
--   Bayside Lacrosse Club          /?club=bayside-lacrosse&variant=fastbreak
--   Brighton Rugby Union           /?club=brighton-rugby&variant=rugbyunion
--   Riverstone Rugby League        /?club=riverstone-rugby-league&variant=rugbyleague
--   Sunset Oztag                   /?club=sunset-oztag&variant=oztag
--   Coastal Touch                  /?club=coastal-touch&variant=touch
--   Westvale Junior Football Club  /?club=westvale-juniors&variant=juniors
--   Vintage Reds Masters           /?club=vintage-masters&variant=masters
--   Lakes United FNC               /?club=lakes-united-fnc&variant=fieldcourt
-- ============================================================================

-- 1) Clear prior demo content (safe re-run) ----------------------------------
delete from news where club_id in (select id from clubs where slug in ('northside-lions','eastside-united','riverside-cricket','parkville-netball','metro-city-basketball','bayside-lacrosse','brighton-rugby','riverstone-rugby-league','sunset-oztag','coastal-touch','westvale-juniors','vintage-masters','lakes-united-fnc'));
delete from events where club_id in (select id from clubs where slug in ('northside-lions','eastside-united','riverside-cricket','parkville-netball','metro-city-basketball','bayside-lacrosse','brighton-rugby','riverstone-rugby-league','sunset-oztag','coastal-touch','westvale-juniors','vintage-masters','lakes-united-fnc'));
delete from sponsors where club_id in (select id from clubs where slug in ('northside-lions','eastside-united','riverside-cricket','parkville-netball','metro-city-basketball','bayside-lacrosse','brighton-rugby','riverstone-rugby-league','sunset-oztag','coastal-touch','westvale-juniors','vintage-masters','lakes-united-fnc'));
delete from teams where club_id in (select id from clubs where slug in ('northside-lions','eastside-united','riverside-cricket','parkville-netball','metro-city-basketball','bayside-lacrosse','brighton-rugby','riverstone-rugby-league','sunset-oztag','coastal-touch','westvale-juniors','vintage-masters','lakes-united-fnc'));
delete from matches where club_id in (select id from clubs where slug in ('northside-lions','eastside-united','riverside-cricket','parkville-netball','metro-city-basketball','bayside-lacrosse','brighton-rugby','riverstone-rugby-league','sunset-oztag','coastal-touch','westvale-juniors','vintage-masters','lakes-united-fnc'));
delete from ladder where club_id in (select id from clubs where slug in ('northside-lions','eastside-united','riverside-cricket','parkville-netball','metro-city-basketball','bayside-lacrosse','brighton-rugby','riverstone-rugby-league','sunset-oztag','coastal-touch','westvale-juniors','vintage-masters','lakes-united-fnc'));

-- 2) Create clubs if missing (sport_type uses valid enum values) -----------
insert into clubs (name, slug, sport_type, primary_colour, secondary_colour, contact_email)
select 'Northside Lions FC','northside-lions','afl'::sport_type,
  '#0a1a3f','#c8102e','info+northside-lions@sportsweb.com.au'
where not exists (select 1 from clubs where slug='northside-lions');
insert into clubs (name, slug, sport_type, primary_colour, secondary_colour, contact_email)
select 'Eastside United SC','eastside-united','soccer'::sport_type,
  '#0b6b3a','#b6f24a','info+eastside-united@sportsweb.com.au'
where not exists (select 1 from clubs where slug='eastside-united');
insert into clubs (name, slug, sport_type, primary_colour, secondary_colour, contact_email)
select 'Riverside Cricket Club','riverside-cricket','cricket'::sport_type,
  '#14532d','#9b2226','info+riverside-cricket@sportsweb.com.au'
where not exists (select 1 from clubs where slug='riverside-cricket');
insert into clubs (name, slug, sport_type, primary_colour, secondary_colour, contact_email)
select 'Parkville Netball Club','parkville-netball','netball'::sport_type,
  '#0e7c7b','#ff6f61','info+parkville-netball@sportsweb.com.au'
where not exists (select 1 from clubs where slug='parkville-netball');
insert into clubs (name, slug, sport_type, primary_colour, secondary_colour, contact_email)
select 'Metro City Basketball','metro-city-basketball','basketball'::sport_type,
  '#ff6b1a','#0d0d10','info+metro-city-basketball@sportsweb.com.au'
where not exists (select 1 from clubs where slug='metro-city-basketball');
insert into clubs (name, slug, sport_type, primary_colour, secondary_colour, contact_email)
select 'Bayside Lacrosse Club','bayside-lacrosse','other'::sport_type,
  '#00c2b3','#2b1a55','info+bayside-lacrosse@sportsweb.com.au'
where not exists (select 1 from clubs where slug='bayside-lacrosse');
insert into clubs (name, slug, sport_type, primary_colour, secondary_colour, contact_email)
select 'Brighton Rugby Union','brighton-rugby','rugby_union'::sport_type,
  '#0b3d2e','#c9a227','info+brighton-rugby@sportsweb.com.au'
where not exists (select 1 from clubs where slug='brighton-rugby');
insert into clubs (name, slug, sport_type, primary_colour, secondary_colour, contact_email)
select 'Riverstone Rugby League','riverstone-rugby-league','rugby_league'::sport_type,
  '#d62828','#14110f','info+riverstone-rugby-league@sportsweb.com.au'
where not exists (select 1 from clubs where slug='riverstone-rugby-league');
insert into clubs (name, slug, sport_type, primary_colour, secondary_colour, contact_email)
select 'Sunset Oztag','sunset-oztag','other'::sport_type,
  '#b5179e','#4cc9f0','info+sunset-oztag@sportsweb.com.au'
where not exists (select 1 from clubs where slug='sunset-oztag');
insert into clubs (name, slug, sport_type, primary_colour, secondary_colour, contact_email)
select 'Coastal Touch','coastal-touch','other'::sport_type,
  '#2ec4b6','#ff9f1c','info+coastal-touch@sportsweb.com.au'
where not exists (select 1 from clubs where slug='coastal-touch');
insert into clubs (name, slug, sport_type, primary_colour, secondary_colour, contact_email)
select 'Westvale Junior Football Club','westvale-juniors','afl'::sport_type,
  '#2aa7ff','#ffc83d','info+westvale-juniors@sportsweb.com.au'
where not exists (select 1 from clubs where slug='westvale-juniors');
insert into clubs (name, slug, sport_type, primary_colour, secondary_colour, contact_email)
select 'Vintage Reds Masters','vintage-masters','afl'::sport_type,
  '#6e1f2a','#c79a3a','info+vintage-masters@sportsweb.com.au'
where not exists (select 1 from clubs where slug='vintage-masters');
insert into clubs (name, slug, sport_type, primary_colour, secondary_colour, contact_email)
select 'Lakes United FNC','lakes-united-fnc','afl'::sport_type,
  '#16284a','#e0533d','info+lakes-united-fnc@sportsweb.com.au'
where not exists (select 1 from clubs where slug='lakes-united-fnc');

-- 3) Seed content -----------------------------------------------------------
-- Northside Lions FC
insert into news (club_id,status,title,slug,author,summary,content,published_at) values
  ((select id from clubs where slug='northside-lions'),'published','Lions roar home in season opener','lions-roar-home','Match Committee','A four-goal final term sealed a stirring win to open the year.','<p>A four-goal final term sealed a stirring win to open the year.</p>', now() - interval '2 days'),
  ((select id from clubs where slug='northside-lions'),'published','Women''s side names leadership group','womens-leadership','Club','Four players will steer the side in a big season.','<p>Four players will steer the side in a big season.</p>', now() - interval '6 days'),
  ((select id from clubs where slug='northside-lions'),'published','Auskick registrations now open','auskick-open','Juniors','Friday-night Auskick is back — first session free.','<p>Friday-night Auskick is back — first session free.</p>', now() - interval '10 days');
insert into events (club_id,status,title,slug,event_date,location,description,featured) values
  ((select id from clubs where slug='northside-lions'),'published','Season Launch & Sponsors'' Night','season-launch', now() + interval '9 days','Lions Clubrooms','Join us at the club.', true),
  ((select id from clubs where slug='northside-lions'),'published','Ladies'' Day','ladies-day', now() + interval '23 days','Northside Oval','Join us at the club.', false);
insert into sponsors (club_id,status,name,sponsor_level,blurb,display_order,in_carousel) values
  ((select id from clubs where slug='northside-lions'),'published','Northside Toyota','platinum','Proud major partner of the Lions.',1,true),
  ((select id from clubs where slug='northside-lions'),'published','The Commercial Hotel','gold','Post-match home of the Lions faithful.',2,true);
insert into teams (club_id,status,name,slug,age_group,gender,grade,display_order) values
  ((select id from clubs where slug='northside-lions'),'published','Seniors','northside-lions-seniors','Open','Men','Men''s',1),
  ((select id from clubs where slug='northside-lions'),'published','Women''s','northside-lions-women-s','Open','Women','Women''s',2),
  ((select id from clubs where slug='northside-lions'),'published','Under 18 Boys','northside-lions-under-18-boys','U18','Men','Junior Boys',3),
  ((select id from clubs where slug='northside-lions'),'published','Under 16 Girls','northside-lions-under-16-girls','U16','Women','Junior Girls',4);
insert into matches (club_id,status,grade,round,match_date,opponent,home_away,our_score,opponent_score) values
  ((select id from clubs where slug='northside-lions'),'completed','Seniors','Round 1', now() - interval '2 days','Westvale Hawks','Home',96,78),
  ((select id from clubs where slug='northside-lions'),'scheduled','Seniors','Round 2', now() + interval '5 days','Riverbend Saints','Away',null,null),
  ((select id from clubs where slug='northside-lions'),'scheduled','Seniors','Round 3', now() + interval '12 days','Hillcrest Tigers','Home',null,null),
  ((select id from clubs where slug='northside-lions'),'scheduled','Seniors','Round 4', now() + interval '19 days','Eastlake Crows','Away',null,null);
insert into ladder (club_id,grade,position,team,played,won,lost,drawn,points,percentage,is_own) values
  ((select id from clubs where slug='northside-lions'),'Seniors',1,'Northside Lions FC',1,1,0,0,4,1.42,true),
  ((select id from clubs where slug='northside-lions'),'Seniors',2,'Westvale Hawks',1,1,0,0,4,1.23,false),
  ((select id from clubs where slug='northside-lions'),'Seniors',3,'Riverbend Saints',1,1,0,0,4,1.18,false),
  ((select id from clubs where slug='northside-lions'),'Seniors',4,'Hillcrest Tigers',1,0,1,0,0,0.84,false),
  ((select id from clubs where slug='northside-lions'),'Seniors',5,'Eastlake Crows',1,0,1,0,0,0.81,false);

-- Eastside United SC
insert into news (club_id,status,title,slug,author,summary,content,published_at) values
  ((select id from clubs where slug='eastside-united'),'published','United edge a five-goal thriller','united-thriller','Match Report','A stoppage-time winner sent the home end into raptures.','<p>A stoppage-time winner sent the home end into raptures.</p>', now() - interval '2 days'),
  ((select id from clubs where slug='eastside-united'),'published','New women''s coach appointed','womens-coach','Club','A vastly experienced head coach joins for the new season.','<p>A vastly experienced head coach joins for the new season.</p>', now() - interval '6 days'),
  ((select id from clubs where slug='eastside-united'),'published','MiniRoos sign-on day this Saturday','miniroos-signon','Juniors','First touch of the ball for our youngest players.','<p>First touch of the ball for our youngest players.</p>', now() - interval '10 days');
insert into events (club_id,status,title,slug,event_date,location,description,featured) values
  ((select id from clubs where slug='eastside-united'),'published','Presentation Night','presentation-night', now() + interval '14 days','United Pavilion','Join us at the club.', true),
  ((select id from clubs where slug='eastside-united'),'published','Gala Day','gala-day', now() + interval '28 days','Eastside Reserve','Join us at the club.', false);
insert into sponsors (club_id,status,name,sponsor_level,blurb,display_order,in_carousel) values
  ((select id from clubs where slug='eastside-united'),'published','Eastside Sports Physio','platinum','Keeping United on the park.',1,true),
  ((select id from clubs where slug='eastside-united'),'published','Corner Flag Cafe','gold','Match-day coffee partner.',2,true);
insert into teams (club_id,status,name,slug,age_group,gender,grade,display_order) values
  ((select id from clubs where slug='eastside-united'),'published','Men''s First XI','eastside-united-men-s-first-xi','Open','Men','Men''s',1),
  ((select id from clubs where slug='eastside-united'),'published','Women''s First XI','eastside-united-women-s-first-xi','Open','Women','Women''s',2),
  ((select id from clubs where slug='eastside-united'),'published','Junior Boys','eastside-united-junior-boys','U13','Men','Junior Boys',3),
  ((select id from clubs where slug='eastside-united'),'published','Junior Girls','eastside-united-junior-girls','U13','Women','Junior Girls',4);
insert into matches (club_id,status,grade,round,match_date,opponent,home_away,our_score,opponent_score) values
  ((select id from clubs where slug='eastside-united'),'completed','Men''s','Round 1', now() - interval '2 days','Harbour City FC','Home',3,2),
  ((select id from clubs where slug='eastside-united'),'scheduled','Men''s','Round 2', now() + interval '5 days','Parkside Rovers','Away',null,null),
  ((select id from clubs where slug='eastside-united'),'scheduled','Men''s','Round 3', now() + interval '12 days','Lakeside United','Home',null,null),
  ((select id from clubs where slug='eastside-united'),'scheduled','Men''s','Round 4', now() + interval '19 days','Marrick Athletic','Away',null,null);
insert into ladder (club_id,grade,position,team,played,won,lost,drawn,points,percentage,is_own) values
  ((select id from clubs where slug='eastside-united'),'Men''s',1,'Eastside United SC',1,1,0,0,3,3.0,true),
  ((select id from clubs where slug='eastside-united'),'Men''s',2,'Harbour City FC',1,1,0,0,3,3.0,false),
  ((select id from clubs where slug='eastside-united'),'Men''s',3,'Parkside Rovers',1,1,0,0,3,3.0,false),
  ((select id from clubs where slug='eastside-united'),'Men''s',4,'Lakeside United',1,0,1,0,0,0.0,false),
  ((select id from clubs where slug='eastside-united'),'Men''s',5,'Marrick Athletic',1,0,1,0,0,0.0,false);

-- Riverside Cricket Club
insert into news (club_id,status,title,slug,author,summary,content,published_at) values
  ((select id from clubs where slug='riverside-cricket'),'published','First XI chase down 240 in the last over','first-xi-chase','Scorers','A captain''s knock of 96 not out got us home with a ball to spare.','<p>A captain''s knock of 96 not out got us home with a ball to spare.</p>', now() - interval '2 days'),
  ((select id from clubs where slug='riverside-cricket'),'published','Junior Blasters program returns','junior-blasters','Juniors','Saturday-morning cricket for our youngest players is back.','<p>Saturday-morning cricket for our youngest players is back.</p>', now() - interval '6 days'),
  ((select id from clubs where slug='riverside-cricket'),'published','Turf wicket upgrade complete','turf-upgrade','Ground Staff','The centre square has never looked better.','<p>The centre square has never looked better.</p>', now() - interval '10 days');
insert into events (club_id,status,title,slug,event_date,location,description,featured) values
  ((select id from clubs where slug='riverside-cricket'),'published','Season Opening BBQ','opening-bbq', now() + interval '7 days','Riverside Clubrooms','Join us at the club.', true),
  ((select id from clubs where slug='riverside-cricket'),'published','Presentation Day','presentation-day', now() + interval '30 days','Riverside Oval','Join us at the club.', false);
insert into sponsors (club_id,status,name,sponsor_level,blurb,display_order,in_carousel) values
  ((select id from clubs where slug='riverside-cricket'),'published','Riverside Hardware','platinum','Proudly backing local cricket.',1,true),
  ((select id from clubs where slug='riverside-cricket'),'published','The Boundary Bakehouse','gold','Fuelling the long days in the field.',2,true);
insert into teams (club_id,status,name,slug,age_group,gender,grade,display_order) values
  ((select id from clubs where slug='riverside-cricket'),'published','First XI','riverside-cricket-first-xi','Open','Men','Men''s',1),
  ((select id from clubs where slug='riverside-cricket'),'published','Women''s XI','riverside-cricket-women-s-xi','Open','Women','Women''s',2),
  ((select id from clubs where slug='riverside-cricket'),'published','Under 16 Boys','riverside-cricket-under-16-boys','U16','Men','Junior Boys',3),
  ((select id from clubs where slug='riverside-cricket'),'published','Under 14 Girls','riverside-cricket-under-14-girls','U14','Women','Junior Girls',4);
insert into matches (club_id,status,grade,round,match_date,opponent,home_away,our_score,opponent_score) values
  ((select id from clubs where slug='riverside-cricket'),'completed','First XI','Round 1', now() - interval '2 days','Glenmore CC','Home',241,238),
  ((select id from clubs where slug='riverside-cricket'),'scheduled','First XI','Round 2', now() + interval '5 days','Bayswater CC','Away',null,null),
  ((select id from clubs where slug='riverside-cricket'),'scheduled','First XI','Round 3', now() + interval '12 days','Oakridge CC','Home',null,null),
  ((select id from clubs where slug='riverside-cricket'),'scheduled','First XI','Round 4', now() + interval '19 days','Stonefield CC','Away',null,null);
insert into ladder (club_id,grade,position,team,played,won,lost,drawn,points,percentage,is_own) values
  ((select id from clubs where slug='riverside-cricket'),'First XI',1,'Riverside Cricket Club',1,1,0,0,6,1.03,true),
  ((select id from clubs where slug='riverside-cricket'),'First XI',2,'Glenmore CC',1,1,0,0,6,1.01,false),
  ((select id from clubs where slug='riverside-cricket'),'First XI',3,'Bayswater CC',1,1,0,0,6,1.0,false),
  ((select id from clubs where slug='riverside-cricket'),'First XI',4,'Oakridge CC',1,0,1,0,0,0.97,false),
  ((select id from clubs where slug='riverside-cricket'),'First XI',5,'Stonefield CC',1,0,1,0,0,0.95,false);

-- Parkville Netball Club
insert into news (club_id,status,title,slug,author,summary,content,published_at) values
  ((select id from clubs where slug='parkville-netball'),'published','Stars edged in a thriller on the buzzer','stars-thriller','Coach','A one-goal win to open the season in front of a packed court.','<p>A one-goal win to open the season in front of a packed court.</p>', now() - interval '2 days'),
  ((select id from clubs where slug='parkville-netball'),'published','NetSetGo sign-on this Saturday','netsetgo-signon','Juniors','First taste of netball for our youngest players.','<p>First taste of netball for our youngest players.</p>', now() - interval '6 days'),
  ((select id from clubs where slug='parkville-netball'),'published','New A Grade coach announced','a-grade-coach','Club','An experienced mentor joins for the new campaign.','<p>An experienced mentor joins for the new campaign.</p>', now() - interval '10 days');
insert into events (club_id,status,title,slug,event_date,location,description,featured) values
  ((select id from clubs where slug='parkville-netball'),'published','Season Launch Night','season-launch', now() + interval '8 days','Parkville Stadium','Join us at the club.', true),
  ((select id from clubs where slug='parkville-netball'),'published','Club Awards Night','awards-night', now() + interval '26 days','Parkville Function Room','Join us at the club.', false);
insert into sponsors (club_id,status,name,sponsor_level,blurb,display_order,in_carousel) values
  ((select id from clubs where slug='parkville-netball'),'published','Parkville Physio','platinum','Keeping our players on court.',1,true),
  ((select id from clubs where slug='parkville-netball'),'published','Court Side Cafe','gold','Match-day coffee partner.',2,true);
insert into teams (club_id,status,name,slug,age_group,gender,grade,display_order) values
  ((select id from clubs where slug='parkville-netball'),'published','A Grade','parkville-netball-a-grade','Open','Women','A Grade',1),
  ((select id from clubs where slug='parkville-netball'),'published','B Grade','parkville-netball-b-grade','Open','Women','B Grade',2),
  ((select id from clubs where slug='parkville-netball'),'published','Under 17','parkville-netball-under-17','U17','Women','Junior Girls',3),
  ((select id from clubs where slug='parkville-netball'),'published','Mixed Social','parkville-netball-mixed-social','Open','Mixed','Mixed',4);
insert into matches (club_id,status,grade,round,match_date,opponent,home_away,our_score,opponent_score) values
  ((select id from clubs where slug='parkville-netball'),'completed','A Grade','Round 1', now() - interval '2 days','Hawthorn Stars','Home',54,49),
  ((select id from clubs where slug='parkville-netball'),'scheduled','A Grade','Round 2', now() + interval '5 days','Eastern Eagles','Away',null,null),
  ((select id from clubs where slug='parkville-netball'),'scheduled','A Grade','Round 3', now() + interval '12 days','Western Waves','Home',null,null),
  ((select id from clubs where slug='parkville-netball'),'scheduled','A Grade','Round 4', now() + interval '19 days','Northcote Nets','Away',null,null);
insert into ladder (club_id,grade,position,team,played,won,lost,drawn,points,percentage,is_own) values
  ((select id from clubs where slug='parkville-netball'),'A Grade',1,'Parkville Netball Club',1,1,0,0,4,1.2,true),
  ((select id from clubs where slug='parkville-netball'),'A Grade',2,'Hawthorn Stars',1,1,0,0,4,1.12,false),
  ((select id from clubs where slug='parkville-netball'),'A Grade',3,'Eastern Eagles',1,1,0,0,4,1.05,false),
  ((select id from clubs where slug='parkville-netball'),'A Grade',4,'Western Waves',1,0,1,0,0,0.95,false),
  ((select id from clubs where slug='parkville-netball'),'A Grade',5,'Northcote Nets',1,0,1,0,0,0.88,false);

-- Metro City Basketball
insert into news (club_id,status,title,slug,author,summary,content,published_at) values
  ((select id from clubs where slug='metro-city-basketball'),'published','Heat run away with it in the final quarter','heat-run-away','Stats','A 20-point final term sealed a statement win.','<p>A 20-point final term sealed a statement win.</p>', now() - interval '2 days'),
  ((select id from clubs where slug='metro-city-basketball'),'published','Domestic comp registrations open','domestic-open','Club','Get your team in for the summer season.','<p>Get your team in for the summer season.</p>', now() - interval '6 days'),
  ((select id from clubs where slug='metro-city-basketball'),'published','Rep tryouts announced for 2026','rep-tryouts','Pathways','Dates locked in for representative selection.','<p>Dates locked in for representative selection.</p>', now() - interval '10 days');
insert into events (club_id,status,title,slug,event_date,location,description,featured) values
  ((select id from clubs where slug='metro-city-basketball'),'published','Season Tip-Off','tip-off', now() + interval '6 days','Metro City Stadium','Join us at the club.', true),
  ((select id from clubs where slug='metro-city-basketball'),'published','Presentation Day','presentation-day', now() + interval '30 days','Metro City Stadium','Join us at the club.', false);
insert into sponsors (club_id,status,name,sponsor_level,blurb,display_order,in_carousel) values
  ((select id from clubs where slug='metro-city-basketball'),'published','Metro Sports Store','platinum','Proudly outfitting the club.',1,true),
  ((select id from clubs where slug='metro-city-basketball'),'published','The Free Throw Cafe','gold','Courtside coffee.',2,true);
insert into teams (club_id,status,name,slug,age_group,gender,grade,display_order) values
  ((select id from clubs where slug='metro-city-basketball'),'published','Men''s Div 1','metro-city-basketball-men-s-div-1','Open','Men','Men''s',1),
  ((select id from clubs where slug='metro-city-basketball'),'published','Women''s Div 1','metro-city-basketball-women-s-div-1','Open','Women','Women''s',2),
  ((select id from clubs where slug='metro-city-basketball'),'published','Under 16 Boys','metro-city-basketball-under-16-boys','U16','Men','Junior Boys',3),
  ((select id from clubs where slug='metro-city-basketball'),'published','Under 16 Girls','metro-city-basketball-under-16-girls','U16','Women','Junior Girls',4);
insert into matches (club_id,status,grade,round,match_date,opponent,home_away,our_score,opponent_score) values
  ((select id from clubs where slug='metro-city-basketball'),'completed','Men''s Div 1','Round 1', now() - interval '2 days','Riverside Hawks','Home',88,81),
  ((select id from clubs where slug='metro-city-basketball'),'scheduled','Men''s Div 1','Round 2', now() + interval '5 days','Lakeside Lakers','Away',null,null),
  ((select id from clubs where slug='metro-city-basketball'),'scheduled','Men''s Div 1','Round 3', now() + interval '12 days','Eastgate Heat','Home',null,null),
  ((select id from clubs where slug='metro-city-basketball'),'scheduled','Men''s Div 1','Round 4', now() + interval '19 days','Southside Kings','Away',null,null);
insert into ladder (club_id,grade,position,team,played,won,lost,drawn,points,percentage,is_own) values
  ((select id from clubs where slug='metro-city-basketball'),'Men''s Div 1',1,'Metro City Basketball',1,1,0,0,2,2.0,true),
  ((select id from clubs where slug='metro-city-basketball'),'Men''s Div 1',2,'Riverside Hawks',1,1,0,0,2,2.0,false),
  ((select id from clubs where slug='metro-city-basketball'),'Men''s Div 1',3,'Lakeside Lakers',1,1,0,0,2,1.0,false),
  ((select id from clubs where slug='metro-city-basketball'),'Men''s Div 1',4,'Eastgate Heat',1,0,1,0,0,0.0,false),
  ((select id from clubs where slug='metro-city-basketball'),'Men''s Div 1',5,'Southside Kings',1,0,1,0,0,0.0,false);

-- Bayside Lacrosse Club
insert into news (club_id,status,title,slug,author,summary,content,published_at) values
  ((select id from clubs where slug='bayside-lacrosse'),'published','Last-minute goal seals the points','last-minute-goal','Match Report','An end-to-end thriller went our way in the dying seconds.','<p>An end-to-end thriller went our way in the dying seconds.</p>', now() - interval '2 days'),
  ((select id from clubs where slug='bayside-lacrosse'),'published','Come and try lacrosse this month','come-and-try','Club','Never picked up a stick? Now''s your chance.','<p>Never picked up a stick? Now''s your chance.</p>', now() - interval '6 days'),
  ((select id from clubs where slug='bayside-lacrosse'),'published','Women''s program goes from strength to strength','womens-program','Club','Record numbers at training this pre-season.','<p>Record numbers at training this pre-season.</p>', now() - interval '10 days');
insert into events (club_id,status,title,slug,event_date,location,description,featured) values
  ((select id from clubs where slug='bayside-lacrosse'),'published','Season Opener & BBQ','opener-bbq', now() + interval '7 days','Bayside Reserve','Join us at the club.', true),
  ((select id from clubs where slug='bayside-lacrosse'),'published','Club Presentation','presentation', now() + interval '28 days','Bayside Clubrooms','Join us at the club.', false);
insert into sponsors (club_id,status,name,sponsor_level,blurb,display_order,in_carousel) values
  ((select id from clubs where slug='bayside-lacrosse'),'published','Bayside Health','platinum','Backing local lacrosse.',1,true),
  ((select id from clubs where slug='bayside-lacrosse'),'published','The Crease Cafe','gold','Game-day eats.',2,true);
insert into teams (club_id,status,name,slug,age_group,gender,grade,display_order) values
  ((select id from clubs where slug='bayside-lacrosse'),'published','Men''s Seniors','bayside-lacrosse-men-s-seniors','Open','Men','Men''s',1),
  ((select id from clubs where slug='bayside-lacrosse'),'published','Women''s Seniors','bayside-lacrosse-women-s-seniors','Open','Women','Women''s',2),
  ((select id from clubs where slug='bayside-lacrosse'),'published','Junior Boys','bayside-lacrosse-junior-boys','U15','Men','Junior Boys',3),
  ((select id from clubs where slug='bayside-lacrosse'),'published','Junior Girls','bayside-lacrosse-junior-girls','U15','Women','Junior Girls',4);
insert into matches (club_id,status,grade,round,match_date,opponent,home_away,our_score,opponent_score) values
  ((select id from clubs where slug='bayside-lacrosse'),'completed','Seniors','Round 1', now() - interval '2 days','Coburg Cobras','Home',12,9),
  ((select id from clubs where slug='bayside-lacrosse'),'scheduled','Seniors','Round 2', now() + interval '5 days','Eltham Eagles','Away',null,null),
  ((select id from clubs where slug='bayside-lacrosse'),'scheduled','Seniors','Round 3', now() + interval '12 days','Williamstown','Home',null,null),
  ((select id from clubs where slug='bayside-lacrosse'),'scheduled','Seniors','Round 4', now() + interval '19 days','Footscray','Away',null,null);
insert into ladder (club_id,grade,position,team,played,won,lost,drawn,points,percentage,is_own) values
  ((select id from clubs where slug='bayside-lacrosse'),'Seniors',1,'Bayside Lacrosse Club',1,1,0,0,4,1.4,true),
  ((select id from clubs where slug='bayside-lacrosse'),'Seniors',2,'Coburg Cobras',1,1,0,0,4,1.2,false),
  ((select id from clubs where slug='bayside-lacrosse'),'Seniors',3,'Eltham Eagles',1,1,0,0,4,1.0,false),
  ((select id from clubs where slug='bayside-lacrosse'),'Seniors',4,'Williamstown',1,0,1,0,0,0.9,false),
  ((select id from clubs where slug='bayside-lacrosse'),'Seniors',5,'Footscray',1,0,1,0,0,0.7,false);

-- Brighton Rugby Union
insert into news (club_id,status,title,slug,author,summary,content,published_at) values
  ((select id from clubs where slug='brighton-rugby'),'published','Forwards lay the platform in opening win','forwards-platform','Match Report','A dominant scrum set up a hard-fought victory.','<p>A dominant scrum set up a hard-fought victory.</p>', now() - interval '2 days'),
  ((select id from clubs where slug='brighton-rugby'),'published','Colts program kicks off','colts-kickoff','Juniors','Pathway rugby for our up-and-comers.','<p>Pathway rugby for our up-and-comers.</p>', now() - interval '6 days'),
  ((select id from clubs where slug='brighton-rugby'),'published','Clubhouse renovations complete','clubhouse-reno','Club','The bar and function room have never looked better.','<p>The bar and function room have never looked better.</p>', now() - interval '10 days');
insert into events (club_id,status,title,slug,event_date,location,description,featured) values
  ((select id from clubs where slug='brighton-rugby'),'published','Season Launch Lunch','launch-lunch', now() + interval '9 days','Brighton Clubhouse','Join us at the club.', true),
  ((select id from clubs where slug='brighton-rugby'),'published','Old Boys'' Day','old-boys-day', now() + interval '27 days','Brighton Oval','Join us at the club.', false);
insert into sponsors (club_id,status,name,sponsor_level,blurb,display_order,in_carousel) values
  ((select id from clubs where slug='brighton-rugby'),'published','Brighton Cellars','platinum','Proud club partner.',1,true),
  ((select id from clubs where slug='brighton-rugby'),'published','The Lineout Bar','gold','Post-match home of the club.',2,true);
insert into teams (club_id,status,name,slug,age_group,gender,grade,display_order) values
  ((select id from clubs where slug='brighton-rugby'),'published','1st XV','brighton-rugby-1st-xv','Open','Men','Men''s',1),
  ((select id from clubs where slug='brighton-rugby'),'published','Women''s XV','brighton-rugby-women-s-xv','Open','Women','Women''s',2),
  ((select id from clubs where slug='brighton-rugby'),'published','Colts','brighton-rugby-colts','U18','Men','Junior Boys',3),
  ((select id from clubs where slug='brighton-rugby'),'published','Junior Girls','brighton-rugby-junior-girls','U16','Women','Junior Girls',4);
insert into matches (club_id,status,grade,round,match_date,opponent,home_away,our_score,opponent_score) values
  ((select id from clubs where slug='brighton-rugby'),'completed','1st XV','Round 1', now() - interval '2 days','Camberwell','Home',27,19),
  ((select id from clubs where slug='brighton-rugby'),'scheduled','1st XV','Round 2', now() + interval '5 days','Box Hill','Away',null,null),
  ((select id from clubs where slug='brighton-rugby'),'scheduled','1st XV','Round 3', now() + interval '12 days','Harlequins','Home',null,null),
  ((select id from clubs where slug='brighton-rugby'),'scheduled','1st XV','Round 4', now() + interval '19 days','Power House','Away',null,null);
insert into ladder (club_id,grade,position,team,played,won,lost,drawn,points,percentage,is_own) values
  ((select id from clubs where slug='brighton-rugby'),'1st XV',1,'Brighton Rugby Union',1,1,0,0,5,1.6,true),
  ((select id from clubs where slug='brighton-rugby'),'1st XV',2,'Camberwell',1,1,0,0,5,1.3,false),
  ((select id from clubs where slug='brighton-rugby'),'1st XV',3,'Box Hill',1,1,0,0,5,1.1,false),
  ((select id from clubs where slug='brighton-rugby'),'1st XV',4,'Harlequins',1,0,1,0,0,0.9,false),
  ((select id from clubs where slug='brighton-rugby'),'1st XV',5,'Power House',1,0,1,0,0,0.6,false);

-- Riverstone Rugby League
insert into news (club_id,status,title,slug,author,summary,content,published_at) values
  ((select id from clubs where slug='riverstone-rugby-league'),'published','Big second half powers the win','big-second-half','Match Report','Four tries after the break broke the game open.','<p>Four tries after the break broke the game open.</p>', now() - interval '2 days'),
  ((select id from clubs where slug='riverstone-rugby-league'),'published','Junior league registrations now open','junior-league-open','Juniors','Get the kids signed up for the new season.','<p>Get the kids signed up for the new season.</p>', now() - interval '6 days'),
  ((select id from clubs where slug='riverstone-rugby-league'),'published','Captain re-signs for three more years','captain-resigns','Club','A massive boost to the spine of the side.','<p>A massive boost to the spine of the side.</p>', now() - interval '10 days');
insert into events (club_id,status,title,slug,event_date,location,description,featured) values
  ((select id from clubs where slug='riverstone-rugby-league'),'published','Season Launch','season-launch', now() + interval '6 days','Riverstone Leagues Club','Join us at the club.', true),
  ((select id from clubs where slug='riverstone-rugby-league'),'published','Ladies'' Day','ladies-day', now() + interval '24 days','Riverstone Oval','Join us at the club.', false);
insert into sponsors (club_id,status,name,sponsor_level,blurb,display_order,in_carousel) values
  ((select id from clubs where slug='riverstone-rugby-league'),'published','Riverstone Leagues Club','platinum','The heart of the club.',1,true),
  ((select id from clubs where slug='riverstone-rugby-league'),'published','Westside Tyres','gold','Keeping us rolling.',2,true);
insert into teams (club_id,status,name,slug,age_group,gender,grade,display_order) values
  ((select id from clubs where slug='riverstone-rugby-league'),'published','First Grade','riverstone-rugby-league-first-grade','Open','Men','Men''s',1),
  ((select id from clubs where slug='riverstone-rugby-league'),'published','Women''s','riverstone-rugby-league-women-s','Open','Women','Women''s',2),
  ((select id from clubs where slug='riverstone-rugby-league'),'published','Under 18 Boys','riverstone-rugby-league-under-18-boys','U18','Men','Junior Boys',3),
  ((select id from clubs where slug='riverstone-rugby-league'),'published','Under 16 Girls','riverstone-rugby-league-under-16-girls','U16','Women','Junior Girls',4);
insert into matches (club_id,status,grade,round,match_date,opponent,home_away,our_score,opponent_score) values
  ((select id from clubs where slug='riverstone-rugby-league'),'completed','First Grade','Round 1', now() - interval '2 days','Penrith Pumas','Home',24,18),
  ((select id from clubs where slug='riverstone-rugby-league'),'scheduled','First Grade','Round 2', now() + interval '5 days','Windsor Wolves','Away',null,null),
  ((select id from clubs where slug='riverstone-rugby-league'),'scheduled','First Grade','Round 3', now() + interval '12 days','Quakers Hill','Home',null,null),
  ((select id from clubs where slug='riverstone-rugby-league'),'scheduled','First Grade','Round 4', now() + interval '19 days','Blacktown','Away',null,null);
insert into ladder (club_id,grade,position,team,played,won,lost,drawn,points,percentage,is_own) values
  ((select id from clubs where slug='riverstone-rugby-league'),'First Grade',1,'Riverstone Rugby League',1,1,0,0,2,2.0,true),
  ((select id from clubs where slug='riverstone-rugby-league'),'First Grade',2,'Penrith Pumas',1,1,0,0,2,2.0,false),
  ((select id from clubs where slug='riverstone-rugby-league'),'First Grade',3,'Windsor Wolves',1,1,0,0,2,2.0,false),
  ((select id from clubs where slug='riverstone-rugby-league'),'First Grade',4,'Quakers Hill',1,0,1,0,0,0.0,false),
  ((select id from clubs where slug='riverstone-rugby-league'),'First Grade',5,'Blacktown',1,0,1,0,0,0.0,false);

-- Sunset Oztag
insert into news (club_id,status,title,slug,author,summary,content,published_at) values
  ((select id from clubs where slug='sunset-oztag'),'published','Mixed comp kicks off under lights','mixed-kicks-off','Club','A huge turnout for round one of the summer comp.','<p>A huge turnout for round one of the summer comp.</p>', now() - interval '2 days'),
  ((select id from clubs where slug='sunset-oztag'),'published','Team nominations close Friday','noms-close','Comp','Get your side in before the cut-off.','<p>Get your side in before the cut-off.</p>', now() - interval '6 days'),
  ((select id from clubs where slug='sunset-oztag'),'published','New women''s division added','womens-division','Club','Demand has never been higher.','<p>Demand has never been higher.</p>', now() - interval '10 days');
insert into events (club_id,status,title,slug,event_date,location,description,featured) values
  ((select id from clubs where slug='sunset-oztag'),'published','Summer Comp Launch','comp-launch', now() + interval '5 days','Sunset Reserve','Join us at the club.', true),
  ((select id from clubs where slug='sunset-oztag'),'published','Grand Final Night','grand-final', now() + interval '35 days','Sunset Reserve','Join us at the club.', false);
insert into sponsors (club_id,status,name,sponsor_level,blurb,display_order,in_carousel) values
  ((select id from clubs where slug='sunset-oztag'),'published','Sunset Sports','platinum','Backing social sport.',1,true),
  ((select id from clubs where slug='sunset-oztag'),'published','The Halftime Bar','gold','Post-game refreshments.',2,true);
insert into teams (club_id,status,name,slug,age_group,gender,grade,display_order) values
  ((select id from clubs where slug='sunset-oztag'),'published','Mixed Open','sunset-oztag-mixed-open','Open','Mixed','Mixed',1),
  ((select id from clubs where slug='sunset-oztag'),'published','Men''s Open','sunset-oztag-men-s-open','Open','Men','Men''s',2),
  ((select id from clubs where slug='sunset-oztag'),'published','Women''s Open','sunset-oztag-women-s-open','Open','Women','Women''s',3),
  ((select id from clubs where slug='sunset-oztag'),'published','Juniors','sunset-oztag-juniors','U14','Men','Junior Boys',4);
insert into matches (club_id,status,grade,round,match_date,opponent,home_away,our_score,opponent_score) values
  ((select id from clubs where slug='sunset-oztag'),'completed','Mixed Open','Round 1', now() - interval '2 days','Coastal Crew','Home',8,6),
  ((select id from clubs where slug='sunset-oztag'),'scheduled','Mixed Open','Round 2', now() + interval '5 days','City Slickers','Away',null,null),
  ((select id from clubs where slug='sunset-oztag'),'scheduled','Mixed Open','Round 3', now() + interval '12 days','Park Rangers','Home',null,null),
  ((select id from clubs where slug='sunset-oztag'),'scheduled','Mixed Open','Round 4', now() + interval '19 days','The Tag Team','Away',null,null);
insert into ladder (club_id,grade,position,team,played,won,lost,drawn,points,percentage,is_own) values
  ((select id from clubs where slug='sunset-oztag'),'Mixed Open',1,'Sunset Oztag',1,1,0,0,2,2.0,true),
  ((select id from clubs where slug='sunset-oztag'),'Mixed Open',2,'Coastal Crew',1,1,0,0,2,2.0,false),
  ((select id from clubs where slug='sunset-oztag'),'Mixed Open',3,'City Slickers',1,1,0,0,2,1.0,false),
  ((select id from clubs where slug='sunset-oztag'),'Mixed Open',4,'Park Rangers',1,0,1,0,0,0.0,false),
  ((select id from clubs where slug='sunset-oztag'),'Mixed Open',5,'The Tag Team',1,0,1,0,0,0.0,false);

-- Coastal Touch
insert into news (club_id,status,title,slug,author,summary,content,published_at) values
  ((select id from clubs where slug='coastal-touch'),'published','Drifters held out in a try-fest','drifters-held-out','Match Report','Both sides traded tries before we held on late.','<p>Both sides traded tries before we held on late.</p>', now() - interval '2 days'),
  ((select id from clubs where slug='coastal-touch'),'published','Free come-and-try night this week','come-and-try-night','Club','Bring a mate and give touch a go.','<p>Bring a mate and give touch a go.</p>', now() - interval '6 days'),
  ((select id from clubs where slug='coastal-touch'),'published','Juniors program returns for summer','juniors-return','Juniors','Saturday-morning touch for the kids.','<p>Saturday-morning touch for the kids.</p>', now() - interval '10 days');
insert into events (club_id,status,title,slug,event_date,location,description,featured) values
  ((select id from clubs where slug='coastal-touch'),'published','Season Welcome BBQ','welcome-bbq', now() + interval '7 days','Coastal Fields','Join us at the club.', true),
  ((select id from clubs where slug='coastal-touch'),'published','Presentation Evening','presentation', now() + interval '29 days','Coastal Surf Club','Join us at the club.', false);
insert into sponsors (club_id,status,name,sponsor_level,blurb,display_order,in_carousel) values
  ((select id from clubs where slug='coastal-touch'),'published','Coastal Surf Co','platinum','Riding with the club.',1,true),
  ((select id from clubs where slug='coastal-touch'),'published','The Try Line Kiosk','gold','Game-night feeds.',2,true);
insert into teams (club_id,status,name,slug,age_group,gender,grade,display_order) values
  ((select id from clubs where slug='coastal-touch'),'published','Mixed Open','coastal-touch-mixed-open','Open','Mixed','Mixed',1),
  ((select id from clubs where slug='coastal-touch'),'published','Men''s Open','coastal-touch-men-s-open','Open','Men','Men''s',2),
  ((select id from clubs where slug='coastal-touch'),'published','Women''s Open','coastal-touch-women-s-open','Open','Women','Women''s',3),
  ((select id from clubs where slug='coastal-touch'),'published','Junior Mixed','coastal-touch-junior-mixed','U12','Mixed','Junior Mixed',4);
insert into matches (club_id,status,grade,round,match_date,opponent,home_away,our_score,opponent_score) values
  ((select id from clubs where slug='coastal-touch'),'completed','Mixed Open','Round 1', now() - interval '2 days','Harbour Heat','Home',7,5),
  ((select id from clubs where slug='coastal-touch'),'scheduled','Mixed Open','Round 2', now() + interval '5 days','Bayline','Away',null,null),
  ((select id from clubs where slug='coastal-touch'),'scheduled','Mixed Open','Round 3', now() + interval '12 days','The Drifters','Home',null,null),
  ((select id from clubs where slug='coastal-touch'),'scheduled','Mixed Open','Round 4', now() + interval '19 days','Seaside','Away',null,null);
insert into ladder (club_id,grade,position,team,played,won,lost,drawn,points,percentage,is_own) values
  ((select id from clubs where slug='coastal-touch'),'Mixed Open',1,'Coastal Touch',1,1,0,0,2,2.0,true),
  ((select id from clubs where slug='coastal-touch'),'Mixed Open',2,'Harbour Heat',1,1,0,0,2,2.0,false),
  ((select id from clubs where slug='coastal-touch'),'Mixed Open',3,'Bayline',1,1,0,0,2,1.0,false),
  ((select id from clubs where slug='coastal-touch'),'Mixed Open',4,'The Drifters',1,0,1,0,0,0.0,false),
  ((select id from clubs where slug='coastal-touch'),'Mixed Open',5,'Seaside',1,0,1,0,0,0.0,false);

-- Westvale Junior Football Club
insert into news (club_id,status,title,slug,author,summary,content,published_at) values
  ((select id from clubs where slug='westvale-juniors'),'published','Under 12s salute in a tight one','u12s-salute','Team Manager','A great team effort got the kids home.','<p>A great team effort got the kids home.</p>', now() - interval '2 days'),
  ((select id from clubs where slug='westvale-juniors'),'published','Auskick is back on Friday nights','auskick-back','Juniors','First session is free — bring the family.','<p>First session is free — bring the family.</p>', now() - interval '6 days'),
  ((select id from clubs where slug='westvale-juniors'),'published','Volunteer coaches needed','coaches-needed','Club','Many hands make a great season.','<p>Many hands make a great season.</p>', now() - interval '10 days');
insert into events (club_id,status,title,slug,event_date,location,description,featured) values
  ((select id from clubs where slug='westvale-juniors'),'published','Family Season Launch','family-launch', now() + interval '8 days','Westvale Oval','Join us at the club.', true),
  ((select id from clubs where slug='westvale-juniors'),'published','Footy Colours Day','footy-colours', now() + interval '25 days','Westvale Oval','Join us at the club.', false);
insert into sponsors (club_id,status,name,sponsor_level,blurb,display_order,in_carousel) values
  ((select id from clubs where slug='westvale-juniors'),'published','Westvale IGA','platinum','Feeding the future stars.',1,true),
  ((select id from clubs where slug='westvale-juniors'),'published','Kids Kicks Sports','gold','Boots and gear partner.',2,true);
insert into teams (club_id,status,name,slug,age_group,gender,grade,display_order) values
  ((select id from clubs where slug='westvale-juniors'),'published','Auskick','westvale-juniors-auskick','5-8','Mixed','Auskick',1),
  ((select id from clubs where slug='westvale-juniors'),'published','Under 12 Boys','westvale-juniors-under-12-boys','U12','Men','Junior Boys',2),
  ((select id from clubs where slug='westvale-juniors'),'published','Under 12 Girls','westvale-juniors-under-12-girls','U12','Women','Junior Girls',3),
  ((select id from clubs where slug='westvale-juniors'),'published','Youth Girls','westvale-juniors-youth-girls','U16','Women','Youth',4);
insert into matches (club_id,status,grade,round,match_date,opponent,home_away,our_score,opponent_score) values
  ((select id from clubs where slug='westvale-juniors'),'completed','Under 12s','Round 1', now() - interval '2 days','Highton','Home',48,33),
  ((select id from clubs where slug='westvale-juniors'),'scheduled','Under 12s','Round 2', now() + interval '5 days','Bell Park','Away',null,null),
  ((select id from clubs where slug='westvale-juniors'),'scheduled','Under 12s','Round 3', now() + interval '12 days','Lara','Home',null,null),
  ((select id from clubs where slug='westvale-juniors'),'scheduled','Under 12s','Round 4', now() + interval '19 days','Leopold','Away',null,null);
insert into ladder (club_id,grade,position,team,played,won,lost,drawn,points,percentage,is_own) values
  ((select id from clubs where slug='westvale-juniors'),'Under 12s',1,'Westvale Junior Football Club',1,1,0,0,4,1.5,true),
  ((select id from clubs where slug='westvale-juniors'),'Under 12s',2,'Highton',1,1,0,0,4,1.2,false),
  ((select id from clubs where slug='westvale-juniors'),'Under 12s',3,'Bell Park',1,1,0,0,4,1.0,false),
  ((select id from clubs where slug='westvale-juniors'),'Under 12s',4,'Lara',1,0,1,0,0,0.8,false),
  ((select id from clubs where slug='westvale-juniors'),'Under 12s',5,'Leopold',1,0,1,0,0,0.6,false);

-- Vintage Reds Masters
insert into news (club_id,status,title,slug,author,summary,content,published_at) values
  ((select id from clubs where slug='vintage-masters'),'published','Reds get the chocolates in the opener','reds-chocolates','Social Sec','A win, a sing-song and a long lunch afterwards.','<p>A win, a sing-song and a long lunch afterwards.</p>', now() - interval '2 days'),
  ((select id from clubs where slug='vintage-masters'),'published','New faces welcome — no pressure, all fun','new-faces','Club','Over 35 and keen for a run? Come down.','<p>Over 35 and keen for a run? Come down.</p>', now() - interval '6 days'),
  ((select id from clubs where slug='vintage-masters'),'published','Annual reunion weekend locked in','reunion-weekend','Club','Old teammates, new memories.','<p>Old teammates, new memories.</p>', now() - interval '10 days');
insert into events (club_id,status,title,slug,event_date,location,description,featured) values
  ((select id from clubs where slug='vintage-masters'),'published','Season Launch & Long Lunch','launch-lunch', now() + interval '9 days','Reds Clubrooms','Join us at the club.', true),
  ((select id from clubs where slug='vintage-masters'),'published','Reunion Weekend','reunion', now() + interval '31 days','Reds Oval','Join us at the club.', false);
insert into sponsors (club_id,status,name,sponsor_level,blurb,display_order,in_carousel) values
  ((select id from clubs where slug='vintage-masters'),'published','The Vintage Cellar','platinum','Refreshing the Reds since forever.',1,true),
  ((select id from clubs where slug='vintage-masters'),'published','Reds Bistro','gold','Post-match feeds.',2,true);
insert into teams (club_id,status,name,slug,age_group,gender,grade,display_order) values
  ((select id from clubs where slug='vintage-masters'),'published','Over 35s','vintage-masters-over-35s','35+','Men','Over 35s',1),
  ((select id from clubs where slug='vintage-masters'),'published','Over 45s','vintage-masters-over-45s','45+','Men','Over 45s',2),
  ((select id from clubs where slug='vintage-masters'),'published','Supers 55+','vintage-masters-supers-55','55+','Men','Over 55s',3),
  ((select id from clubs where slug='vintage-masters'),'published','Women''s Masters','vintage-masters-women-s-masters','Open','Women','Women''s',4);
insert into matches (club_id,status,grade,round,match_date,opponent,home_away,our_score,opponent_score) values
  ((select id from clubs where slug='vintage-masters'),'completed','Over 35s','Round 1', now() - interval '2 days','Old Scotch','Home',56,50),
  ((select id from clubs where slug='vintage-masters'),'scheduled','Over 35s','Round 2', now() + interval '5 days','Yarra Valley','Away',null,null),
  ((select id from clubs where slug='vintage-masters'),'scheduled','Over 35s','Round 3', now() + interval '12 days','The Has-Beens','Home',null,null),
  ((select id from clubs where slug='vintage-masters'),'scheduled','Over 35s','Round 4', now() + interval '19 days','Golden Oldies','Away',null,null);
insert into ladder (club_id,grade,position,team,played,won,lost,drawn,points,percentage,is_own) values
  ((select id from clubs where slug='vintage-masters'),'Over 35s',1,'Vintage Reds Masters',1,1,0,0,4,1.3,true),
  ((select id from clubs where slug='vintage-masters'),'Over 35s',2,'Old Scotch',1,1,0,0,4,1.1,false),
  ((select id from clubs where slug='vintage-masters'),'Over 35s',3,'Yarra Valley',1,1,0,0,4,1.0,false),
  ((select id from clubs where slug='vintage-masters'),'Over 35s',4,'The Has-Beens',1,0,1,0,0,0.9,false),
  ((select id from clubs where slug='vintage-masters'),'Over 35s',5,'Golden Oldies',1,0,1,0,0,0.7,false);

-- Lakes United FNC
insert into news (club_id,status,title,slug,author,summary,content,published_at) values
  ((select id from clubs where slug='lakes-united-fnc'),'published','Big day out as footy and netball both salute','big-day-out','Club','A clean sweep across the grounds and the courts.','<p>A clean sweep across the grounds and the courts.</p>', now() - interval '2 days'),
  ((select id from clubs where slug='lakes-united-fnc'),'published','One club, two codes — rego now open','rego-open','Club','Football and netball sign-on is live.','<p>Football and netball sign-on is live.</p>', now() - interval '6 days'),
  ((select id from clubs where slug='lakes-united-fnc'),'published','Volunteers power our biggest season yet','volunteers-power','Club','Thank you to everyone pitching in.','<p>Thank you to everyone pitching in.</p>', now() - interval '10 days');
insert into events (club_id,status,title,slug,event_date,location,description,featured) values
  ((select id from clubs where slug='lakes-united-fnc'),'published','Season Launch','season-launch', now() + interval '8 days','Lakes Reserve','Join us at the club.', true),
  ((select id from clubs where slug='lakes-united-fnc'),'published','Family Fun Day','family-fun', now() + interval '27 days','Lakes Reserve','Join us at the club.', false);
insert into sponsors (club_id,status,name,sponsor_level,blurb,display_order,in_carousel) values
  ((select id from clubs where slug='lakes-united-fnc'),'published','Lakes Real Estate','platinum','Proud major partner of the Lakes.',1,true),
  ((select id from clubs where slug='lakes-united-fnc'),'published','United Bakehouse','gold','Game-day pies and coffee.',2,true);
insert into teams (club_id,status,name,slug,age_group,gender,grade,display_order) values
  ((select id from clubs where slug='lakes-united-fnc'),'published','Seniors (Football)','lakes-united-fnc-seniors-football','Open','Men','Men''s',1),
  ((select id from clubs where slug='lakes-united-fnc'),'published','Netball A Grade','lakes-united-fnc-netball-a-grade','Open','Women','Women''s',2),
  ((select id from clubs where slug='lakes-united-fnc'),'published','Junior Boys Football','lakes-united-fnc-junior-boys-football','U16','Men','Junior Boys',3),
  ((select id from clubs where slug='lakes-united-fnc'),'published','Junior Girls Netball','lakes-united-fnc-junior-girls-netball','U16','Women','Junior Girls',4);
insert into matches (club_id,status,grade,round,match_date,opponent,home_away,our_score,opponent_score) values
  ((select id from clubs where slug='lakes-united-fnc'),'completed','Seniors','Round 1', now() - interval '2 days','Shoreham','Home',72,65),
  ((select id from clubs where slug='lakes-united-fnc'),'scheduled','Seniors','Round 2', now() + interval '5 days','Devon Meadows','Away',null,null),
  ((select id from clubs where slug='lakes-united-fnc'),'scheduled','Seniors','Round 3', now() + interval '12 days','Tooradin','Home',null,null),
  ((select id from clubs where slug='lakes-united-fnc'),'scheduled','Seniors','Round 4', now() + interval '19 days','Pearcedale','Away',null,null);
insert into ladder (club_id,grade,position,team,played,won,lost,drawn,points,percentage,is_own) values
  ((select id from clubs where slug='lakes-united-fnc'),'Seniors',1,'Lakes United FNC',1,1,0,0,4,1.4,true),
  ((select id from clubs where slug='lakes-united-fnc'),'Seniors',2,'Shoreham',1,1,0,0,4,1.2,false),
  ((select id from clubs where slug='lakes-united-fnc'),'Seniors',3,'Devon Meadows',1,1,0,0,4,1.0,false),
  ((select id from clubs where slug='lakes-united-fnc'),'Seniors',4,'Tooradin',1,0,1,0,0,0.85,false),
  ((select id from clubs where slug='lakes-united-fnc'),'Seniors',5,'Pearcedale',1,0,1,0,0,0.6,false);

-- Done. Reload the site with the ?club=...&variant=... links above.