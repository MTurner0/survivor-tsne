# Manage imports
import pandas as pd
from sklearn.manifold import TSNE

# Read data
castaways = pd.read_csv('data/raw/castaways.csv')
castaway_details = pd.read_csv('data/raw/castaway_details.csv')
confessionals = pd.read_csv('data/raw/confessionals.csv')

# Get total confessional count for each castaway
confessionals = confessionals.loc[:, ['castaway_id', 'season', 'confessional_count']].groupby(['castaway_id', 'season']).sum()

# Replace result with jury status if it exists
castaways.result = [castaway[15] if pd.notna(castaway[15]) else castaway[14] for castaway in castaways.values]

# Remove cols
castaways.drop(['city', 'jury_status', 'original_tribe', 'version', 'order', 'episode',
                'version_season'],
    axis=1, inplace=True)

# Ignore Redemption Island/EOE
castaways = castaways.groupby(['castaway_id', 'season']).max().reset_index()

# Since not all seasons have equal numbers of castaways or days played, castaways will be ranked
# based on proportion of days survived out of total days in the season
m_days = list(castaways.loc[:, ['season', 'day']].groupby(['season']).max()[['day']].day)
castaways['prop_sur'] = [row[8]/m_days[row[1] - 1] for row in castaways.values]

# Remove cols
castaway_details.drop(['full_name', 'personality_type', 'date_of_birth', 'date_of_death', 'occupation',
                        'ethnicity', 'race'], axis=1, inplace=True)

# Combine data and remove rows with NAs
all_contestants = confessionals.merge(castaways,
                                    on=['castaway_id', 'season']).merge(castaway_details,
                                    on='castaway_id').dropna()

# Reserve information to label points
bio = all_contestants.loc[:, ['full_name', 'season_name', 'state', 'age', 'result']]
all_contestants.drop(['castaway_id', 'season_name', 'full_name', 'short_name', 'castaway', 'day', 'result'],
                    axis=1, inplace=True)

# Make season categorical
all_contestants.season = [str(szn) for szn in all_contestants.season]

# Run t-SNE
features = pd.get_dummies(all_contestants)
projected = TSNE(n_components=2, random_state=1416).fit_transform(features)

# Get rid of "Survivor: " in front of every season name
bio.season_name = [szn_name.split(':')[1] for szn_name in bio.season_name]

# Store reserved info and t-SNE projection coordinates in a JSON file
pd.concat([bio, pd.DataFrame(projected)],
    axis=1).to_json('data/processed/tsne-results.json', orient='index')