const JIRA_HOST = 'sciarramartin.atlassian.net';
const JIRA_USERNAME = 'sciarra.martin@gmail.com';
const JIRA_PASSWORD = 'ATATT3xFfGF0F_Zs9FUSPQVcozPaYyacxN_pjSWVvb3vrxAFny2MJB0-WPYZfVSkDwe7FJ2Vv179tRWu4NNZGZ075o6b1K1BtonW2miMfelcnDHEZ_iNRnHJakzjlJtc8o9bhkgHp-o65ssz0UwwQp-yqjDfMkW4JChsiWEcGXthmPCNv3_Xb3o=35A73DD8';

const auth = 'Basic ' + Buffer.from(`${JIRA_USERNAME}:${JIRA_PASSWORD}`).toString('base64');

async function getIssues() {
  const issues = [];
  // Loop from KAN-4 to KAN-30 just to be safe and cover all possible stories
  for (let i = 4; i <= 30; i++) {
    const key = `KAN-${i}`;
    try {
      const response = await fetch(`https://${JIRA_HOST}/rest/api/2/issue/${key}`, {
        headers: {
          'Authorization': auth,
          'Accept': 'application/json'
        }
      });
      if (response.status === 404) {
        continue;
      }
      if (!response.ok) {
        console.error(`Error fetching ${key}: Status ${response.status}`);
        continue;
      }
      const data = await response.json();
      issues.push({
        key,
        summary: data.fields.summary,
        description: data.fields.description,
        status: data.fields.status ? data.fields.status.name : 'Unknown'
      });
    } catch (err) {
      console.error(`Failed to fetch ${key}:`, err.message);
    }
  }
  console.log(JSON.stringify(issues, null, 2));
}

getIssues();
