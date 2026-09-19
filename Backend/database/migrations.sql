-- Schema upgrades applied on top of u378403689_ptci_cultural.sql.
-- The original dump has no keys at all, which is why duplicate usernames and an
-- id of 0 already exist in `users`, and why a judge could submit twice.

-- 1. Account activation, required by the admin account-management screens.
ALTER TABLE `users`
  ADD COLUMN IF NOT EXISTS `is_active` TINYINT(1) NOT NULL DEFAULT 1;

-- 2. Clean up rows the missing constraints let through, so the keys below can apply.
DELETE FROM `users` WHERE `id` = 0;
UPDATE `users` SET `role` = 'judge' WHERE `role` NOT IN ('judge', 'admin');

-- 3. Primary keys.
ALTER TABLE `users`                       ADD PRIMARY KEY (`id`);
ALTER TABLE `teams`                       ADD PRIMARY KEY (`team_id`);
ALTER TABLE `vocal_contestants`           ADD PRIMARY KEY (`cand_id`);
ALTER TABLE `vocal_score`                 ADD PRIMARY KEY (`score_id`);
ALTER TABLE `modern_score`                ADD PRIMARY KEY (`score_id`);
ALTER TABLE `interpretative_score`        ADD PRIMARY KEY (`score_id`);
ALTER TABLE `vocal_final_score`           ADD PRIMARY KEY (`cand_id`);
ALTER TABLE `modern_final_score`          ADD PRIMARY KEY (`team_id`);
ALTER TABLE `interpretative_final_score`  ADD PRIMARY KEY (`team_id`);

-- 4. One score per judge per subject. This is the duplicate-submission guard the
--    code never had; without it a judge's second submission silently skewed the average.
ALTER TABLE `vocal_score`
  ADD UNIQUE KEY `uniq_vocal_judge_cand` (`cand_id`, `judge_id`);
ALTER TABLE `modern_score`
  ADD UNIQUE KEY `uniq_modern_judge_team` (`team_id`, `judge_id`);
ALTER TABLE `interpretative_score`
  ADD UNIQUE KEY `uniq_interpretative_judge_team` (`team_id`, `judge_id`);

-- 5. Usernames must be unique: login.php requires exactly one matching row, so a
--    duplicate username can never sign in.
ALTER TABLE `users`
  ADD UNIQUE KEY `uniq_users_username` (`username`);
