CREATE TABLE "projects" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"title" text NOT NULL,
	"slug" varchar(255) NOT NULL,
	"description" text,
	"tags" text[],
	"tier" varchar(50) DEFAULT 'free' NOT NULL,
	"difficulty" varchar(50) DEFAULT 'beginner' NOT NULL,
	"created_at" timestamp DEFAULT now(),
	CONSTRAINT "projects_slug_unique" UNIQUE("slug")
);
