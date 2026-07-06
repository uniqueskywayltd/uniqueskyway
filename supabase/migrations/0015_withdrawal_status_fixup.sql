-- Post-enum withdrawal data fixes (must run after 0010 enum values commit)
UPDATE withdrawal_requests SET status = 'submitted' WHERE status = 'pending';
