const JIRA_HOST = 'sciarramartin.atlassian.net';
const JIRA_USERNAME = 'sciarra.martin@gmail.com';
const JIRA_PASSWORD = 'ATATT3xFfGF0F_Zs9FUSPQVcozPaYyacxN_pjSWVvb3vrxAFny2MJB0-WPYZfVSkDwe7FJ2Vv179tRWu4NNZGZ075o6b1K1BtonW2miMfelcnDHEZ_iNRnHJakzjlJtc8o9bhkgHp-o65ssz0UwwQp-yqjDfMkW4JChsiWEcGXthmPCNv3_Xb3o=35A73DD8';

const auth = 'Basic ' + Buffer.from(`${JIRA_USERNAME}:${JIRA_PASSWORD}`).toString('base64');

async function getIssue(key) {
  try {
    // Let's check API v2 first as it returns text/markdown description
    const response = await fetch(`https://${JIRA_HOST}/rest/api/2/issue/${key}`, {
      headers: {
        'Authorization': auth,
        'Accept': 'application/json'
      }
    });
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status} - ${await response.text()}`);
    }
    const data = await response.json();
    console.log(`=== ${key} ===`);
    console.log('Summary:', data.fields.summary);
    console.log('Description:', data.fields.description);
  } catch (error) {
    console.error('Error fetching issue:', error);
  }
}

getIssue('KAN-9');
