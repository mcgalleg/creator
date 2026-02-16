ALTER TABLE "posts" ADD COLUMN "song_artist" text;--> statement-breakpoint
ALTER TABLE "posts" ADD COLUMN "song_duration" integer;--> statement-breakpoint
ALTER TABLE "comments" ADD COLUMN "author_follower_count" integer;--> statement-breakpoint
CREATE TABLE "post_collaborators" (
	"id" serial PRIMARY KEY NOT NULL,
	"post_id" integer NOT NULL,
	"tiktok_user_id" text NOT NULL,
	"username" text NOT NULL,
	"display_name" text,
	"avatar_url" text,
	"is_verified" boolean DEFAULT false,
	"follower_count" bigint DEFAULT 0,
	"created_at" timestamp DEFAULT now() NOT NULL
);--> statement-breakpoint
ALTER TABLE "post_collaborators" ADD CONSTRAINT "post_collaborators_post_id_posts_id_fk" FOREIGN KEY ("post_id") REFERENCES "public"."posts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "post_collabs_post_user_idx" ON "post_collaborators" USING btree ("post_id","tiktok_user_id");
