-- Enhance directory_entries with detailed Ayurvedic fields
ALTER TABLE directory_entries 
ADD COLUMN introduction text,
ADD COLUMN etiology text,
ADD COLUMN synonyms text[] DEFAULT '{}',
ADD COLUMN origin text,
ADD COLUMN definition text,
ADD COLUMN panchabhautikatva text,
ADD COLUMN swaroop text,
ADD COLUMN characteristics text[] DEFAULT '{}',
ADD COLUMN types_description text,
ADD COLUMN sankhya text,
ADD COLUMN prakar_charak text,
ADD COLUMN prakar_sushruta text,
ADD COLUMN moolasthana text,
ADD COLUMN viddha_lakshan text,
ADD COLUMN dushti text,
ADD COLUMN functions text[] DEFAULT '{}',
ADD COLUMN disorders text[] DEFAULT '{}',
ADD COLUMN treatment_principles text[] DEFAULT '{}',
ADD COLUMN related_course_ids uuid[] DEFAULT '{}';

-- Add category column if it differs from type
-- Currently using 'type' for category, but let's add english_name for clarity
ALTER TABLE directory_entries ADD COLUMN english_name text;
ALTER TABLE directory_entries ADD COLUMN meaning text;
