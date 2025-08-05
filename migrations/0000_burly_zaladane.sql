CREATE TABLE "admin_users" (
	"id" serial PRIMARY KEY NOT NULL,
	"username" text NOT NULL,
	"email" text NOT NULL,
	"password_hash" text NOT NULL,
	"reset_token" text,
	"reset_token_expiry" timestamp,
	"last_login" timestamp,
	"created_at" timestamp DEFAULT now(),
	"is_active" boolean DEFAULT true,
	CONSTRAINT "admin_users_username_unique" UNIQUE("username"),
	CONSTRAINT "admin_users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "affiliate_networks" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"slug" text NOT NULL,
	"description" text NOT NULL,
	"commission_rate" numeric(5, 2) NOT NULL,
	"tracking_params" text,
	"logo_url" text,
	"is_active" boolean DEFAULT true,
	"join_url" text,
	CONSTRAINT "affiliate_networks_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "announcements" (
	"id" serial PRIMARY KEY NOT NULL,
	"message" text NOT NULL,
	"is_active" boolean DEFAULT true,
	"text_color" text DEFAULT '#ffffff',
	"background_color" text DEFAULT '#3b82f6',
	"font_size" text DEFAULT '16px',
	"font_weight" text DEFAULT 'normal',
	"text_decoration" text DEFAULT 'none',
	"font_style" text DEFAULT 'normal',
	"animation_speed" text DEFAULT '30',
	"text_border_width" text DEFAULT '0px',
	"text_border_style" text DEFAULT 'solid',
	"text_border_color" text DEFAULT '#000000',
	"banner_border_width" text DEFAULT '0px',
	"banner_border_style" text DEFAULT 'solid',
	"banner_border_color" text DEFAULT '#000000',
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "blog_posts" (
	"id" serial PRIMARY KEY NOT NULL,
	"title" text NOT NULL,
	"excerpt" text NOT NULL,
	"content" text NOT NULL,
	"category" text NOT NULL,
	"tags" text[] NOT NULL,
	"image_url" text NOT NULL,
	"video_url" text,
	"published_at" timestamp NOT NULL,
	"created_at" timestamp DEFAULT now(),
	"read_time" text NOT NULL,
	"slug" text NOT NULL,
	"has_timer" boolean DEFAULT false,
	"timer_duration" integer,
	"timer_start_time" timestamp
);
--> statement-breakpoint
CREATE TABLE "categories" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"icon" text NOT NULL,
	"color" text NOT NULL,
	"description" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "newsletter_subscribers" (
	"id" serial PRIMARY KEY NOT NULL,
	"email" text NOT NULL,
	"subscribed_at" timestamp DEFAULT now(),
	CONSTRAINT "newsletter_subscribers_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "products" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"description" text NOT NULL,
	"price" numeric(10, 2) NOT NULL,
	"original_price" numeric(10, 2),
	"image_url" text NOT NULL,
	"affiliate_url" text NOT NULL,
	"affiliate_network_id" integer,
	"category" text NOT NULL,
	"gender" text,
	"rating" numeric(2, 1) NOT NULL,
	"review_count" integer NOT NULL,
	"discount" integer,
	"is_new" boolean DEFAULT false,
	"is_featured" boolean DEFAULT false,
	"has_timer" boolean DEFAULT false,
	"timer_duration" integer,
	"timer_start_time" timestamp,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
ALTER TABLE "products" ADD CONSTRAINT "products_affiliate_network_id_affiliate_networks_id_fk" FOREIGN KEY ("affiliate_network_id") REFERENCES "public"."affiliate_networks"("id") ON DELETE no action ON UPDATE no action;