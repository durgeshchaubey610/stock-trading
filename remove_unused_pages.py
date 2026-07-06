import os
files = [
    'frontend/src/pages/AIAssistant.tsx',
    'frontend/src/pages/Education.tsx',
    'frontend/src/pages/HealthDashboard.tsx',
    'frontend/src/pages/HealthRecords.tsx',
    'frontend/src/pages/SOSDashboard.tsx',
]
for path in files:
    if os.path.exists(path):
        os.remove(path)
print('Removed unused frontend page modules.')
