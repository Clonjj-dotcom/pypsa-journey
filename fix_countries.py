import re

with open('index.html', 'r') as f:
    content = f.read()

# Extended country list with ALL European countries for PyPSA-Eur
new_country_codes = '''const countryCodes = {
        // Nordic
        "Norway": "NO", "Sweden": "SE", "Finland": "FI", "Denmark": "DK", "Iceland": "IS",
        // Western Europe
        "United Kingdom": "GB", "Ireland": "IE", "France": "FR", 
        "Netherlands": "NL", "Belgium": "BE", "Luxembourg": "LU",
        // Central Europe
        "Germany": "DE", "Switzerland": "CH", "Austria": "AT",
        "Czech Republic": "CZ", "Poland": "PL", "Slovakia": "SK",
        "Hungary": "HU", "Slovenia": "SI",
        // Southern Europe
        "Spain": "ES", "Portugal": "PT", "Italy": "IT", "Malta": "MT", "Cyprus": "CY",
        "Greece": "GR", "Croatia": "HR",
        // Balkans (all)
        "Serbia": "RS", "Bosnia and Herzegovina": "BA", "Montenegro": "ME",
        "North Macedonia": "MK", "Albania": "AL", "Kosovo": "XK",
        // Baltic
        "Estonia": "EE", "Latvia": "LV", "Lithuania": "LT",
        // Eastern Europe & neighbors
        "Romania": "RO", "Bulgaria": "BG", "Moldova": "MD",
        "Ukraine": "UA", "Belarus": "BY",
        // Russia (European part shown)
        "Russia": "RU",
        // Turkey (for interconnection modeling)
        "Turkey": "TR",
        // Caucasus (for neighbor modeling)
        "Georgia": "GE", "Armenia": "AM", "Azerbaijan": "AZ"
    };'''

# Replace the countryCodes definition
old_pattern = r'const countryCodes = \{[^}]+\};'
content = re.sub(old_pattern, new_country_codes, content, flags=re.DOTALL)

# Add console logging to debug which countries are found
old_filter = 'const euCountries = countries.filter(d => countryCodes[d.properties.name]);'
new_filter = '''// Get all countries in our list
        const euCountries = countries.filter(d => countryCodes[d.properties.name]);
        
        console.log('Countries loaded:', euCountries.length, 'of', Object.keys(countryCodes).length);
        console.log('Missing:', Object.keys(countryCodes).filter(code => !euCountries.find(c => countryCodes[c.properties.name] === code)));'''

content = content.replace(old_filter, new_filter)

with open('index.html', 'w') as f:
    f.write(content)

print('✅ Extended to 43+ countries including all Balkans and neighbors')
