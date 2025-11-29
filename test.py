# -*- coding: utf-8 -*-
import re

def insert_language_tags(text: str) -> str:
    def is_greek(char):
        return (
            ('\u0370' <= char <= '\u03FF') or  # Greek and Coptic
            ('\u1F00' <= char <= '\u1FFF')     # Greek Extended
        )

    result = []
    current_lang = None
    i = 0

    # Regex to detect patterns like \english word
    english_word_pattern = re.compile(r'\\english\s+\w+')

    while i < len(text):
        # If a backslash-english pattern is found, copy it as-is and skip
        match = english_word_pattern.match(text, i)
        if match:
            result.append(match.group())
            i = match.end()
            continue

        char = text[i]

        # Skip LaTeX-like commands (anything starting with backslash)
        if char == '\\':
            cmd_start = i
            while i < len(text) and text[i] not in [' ', '\n']:
                i += 1
            result.append(text[cmd_start:i])
            continue

        if is_greek(char):
            if current_lang != 'greek':
                result.append("\\selectlanguage{greek}")
                current_lang = 'greek'
        else:
            if char.isalpha():
                if current_lang != 'english':
                    result.append("\\selectlanguage{english}")
                    current_lang = 'english'
        result.append(char)
        i += 1

    return ''.join(result)


# --- Read from input file ---
input_file = "thesis_latex.txt"  # file containing original text
output_file = "output.txt" # file to save modified text

with open(input_file, "r", encoding="utf-8") as f:
    sample_text = f.read()

# --- Process text ---
modified_text = insert_language_tags(sample_text)

# --- Write to output file ---
with open(output_file, "w", encoding="utf-8") as f:
    f.write(modified_text)

print(f"Modified text written to {output_file}")