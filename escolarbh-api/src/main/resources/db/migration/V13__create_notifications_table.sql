CREATE TABLE notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    sender_id UUID REFERENCES users(id) ON DELETE SET NULL,
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    is_read BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Row Level Security
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own notifications" ON notifications
    FOR SELECT USING ((current_setting('app.current_user_id', TRUE)::UUID) = user_id);

CREATE POLICY "Users can update their own notifications" ON notifications
    FOR UPDATE USING ((current_setting('app.current_user_id', TRUE)::UUID) = user_id);

CREATE POLICY "System and Drivers can insert notifications" ON notifications
    FOR INSERT WITH CHECK (true); -- Supabase RLS will restrict who can call the API in real scenarios, or we can leave it open for authenticated users.

-- Create a function to limit notifications to 8 per user
CREATE OR REPLACE FUNCTION limit_notifications_per_user()
RETURNS TRIGGER AS $$
BEGIN
    -- Delete notifications for this user that are NOT in the top 8 newest
    DELETE FROM notifications
    WHERE user_id = NEW.user_id
    AND id NOT IN (
        SELECT id FROM notifications
        WHERE user_id = NEW.user_id
        ORDER BY created_at DESC
        LIMIT 8
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create the trigger
CREATE TRIGGER enforce_notification_limit
AFTER INSERT ON notifications
FOR EACH ROW
EXECUTE FUNCTION limit_notifications_per_user();
