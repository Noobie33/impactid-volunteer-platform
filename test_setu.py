import urllib.request
import json

def request(method, url, data=None, token=None):
    headers = {}
    if data is not None:
        headers['Content-Type'] = 'application/json'
        body = json.dumps(data).encode()
    else:
        body = None
    if token:
        headers['Authorization'] = f'Bearer {token}'
    req = urllib.request.Request(url, data=body, headers=headers, method=method)
    try:
        with urllib.request.urlopen(req) as resp:
            return resp.status, json.loads(resp.read().decode())
    except urllib.error.HTTPError as e:
        return e.code, json.loads(e.read().decode())

with open(r'd:\impactid-volunteer-platform\setu_postman_vars.json') as f:
    vars = json.load(f)

# Logins
_, d = request('POST', 'http://localhost:5000/auth/login', {'email': 'admin@impactid.test', 'password': 'Admin@123'})
admin_token = d['access_token']
_, d = request('POST', 'http://localhost:5000/auth/login', {'email': 'orgowner@impactid.test', 'password': 'OrgOwner@123'})
owner_token = d['access_token']
_, d = request('POST', 'http://localhost:5000/auth/login', {'email': 'volunteer@impactid.test', 'password': 'Volunteer@123'})
volunteer_token = d['access_token']

vars['ownerToken'] = owner_token
vars['adminToken'] = admin_token
vars['nonAdminToken'] = volunteer_token

print('--- Testing Setu Verification Endpoints ---')
# 1. Approve participation
part1 = vars['approveParticipationId']
s, d = request('POST', f'http://localhost:5000/verifications/{part1}/approve', {'confirmedHours': 1.25}, owner_token)
print('1. Approve participation (Expect 201):', s, d)
verif_id = d.get('data', {}).get('id')
vars['verificationId'] = verif_id

# 2. Reject participation
part2 = vars['rejectParticipationId']
s, d = request('POST', f'http://localhost:5000/verifications/{part2}/reject', {'reason': 'Completion could not be confirmed.'}, owner_token)
print('2. Reject participation (Expect 201):', s, d)

# 3. Read verification
s, d = request('GET', f'http://localhost:5000/verifications/{verif_id}', token=owner_token)
print('3. Read verification (Expect 200):', s, d)

# 4. Revoke verification
s, d = request('POST', f'http://localhost:5000/admin/verifications/{verif_id}/revoke', {'reason': 'Duplicate verification record.'}, token=admin_token)
print('4. Revoke verification (Expect 200):', s, d)

print('\n--- Testing Setu Admin Endpoints ---')
# 5. Approve organization
org1 = vars['approveOrganizationId']
s, d = request('PATCH', f'http://localhost:5000/admin/organizations/{org1}/approve', {'reason': 'Documents reviewed and approved.'}, token=admin_token)
print('5. Approve organization (Expect 200):', s, d)

# 6. Reject organization
org2 = vars['rejectOrganizationId']
s, d = request('PATCH', f'http://localhost:5000/admin/organizations/{org2}/reject', {'reason': 'Required documentation could not be verified.'}, token=admin_token)
print('6. Reject organization (Expect 200):', s, d)

# 7. Update user status
uid = vars['userId']
s, d = request('PATCH', f'http://localhost:5000/admin/users/{uid}/status', {'status': 'SUSPENDED'}, token=admin_token)
print('7. Update user status (Expect 200):', s, d)
# restore to ACTIVE
request('PATCH', f'http://localhost:5000/admin/users/{uid}/status', {'status': 'ACTIVE'}, token=admin_token)

print('\n--- Testing Setu Fraud & Audit Endpoints ---')
# 8. List fraud flags
s, d = request('GET', 'http://localhost:5000/admin/fraud-flags?page=1&limit=10', token=admin_token)
print('8. List fraud flags (Expect 200):', s, d)

# 9. Read fraud flag
fraud_id = vars['fraudFlagId']
s, d = request('GET', f'http://localhost:5000/admin/fraud-flags/{fraud_id}', token=admin_token)
print('9. Read fraud flag (Expect 200):', s, d)

# 10. Review fraud flag (Expect 200) then repeat (Expect 409)
s, d = request('PATCH', f'http://localhost:5000/admin/fraud-flags/{fraud_id}', {'status': 'DISMISSED'}, token=admin_token)
print('10a. Review fraud flag (Expect 200):', s, d)
s, d = request('PATCH', f'http://localhost:5000/admin/fraud-flags/{fraud_id}', {'status': 'DISMISSED'}, token=admin_token)
print('10b. Review fraud flag repeat (Expect 409):', s, d)

# 11. List audit logs
s, d = request('GET', 'http://localhost:5000/admin/audit-logs?page=1&limit=10', token=admin_token)
print('11. List audit logs (Expect 200):', s, d)

print('\n--- Testing Setu Required Failure Evidence ---')
# 12. 400 - Reject without reason
part3 = vars['validationParticipationId']
s, d = request('POST', f'http://localhost:5000/verifications/{part3}/reject', {}, token=owner_token)
print('12. 400 Bad Request (Expect 400):', s, d)

# 13. 401 - Unauthorized
s, d = request('GET', f'http://localhost:5000/verifications/{verif_id}')
print('13. 401 Unauthorized (Expect 401):', s, d)

# 14. 403 - Forbidden
s, d = request('GET', 'http://localhost:5000/admin/audit-logs?page=1&limit=10', token=volunteer_token)
print('14. 403 Forbidden (Expect 403):', s, d)

# Save updated vars with tokens and verificationId
with open(r'd:\impactid-volunteer-platform\setu_postman_vars.json', 'w') as f:
    json.dump(vars, f, indent=2)
print('\nSaved all variables with tokens and verificationId to setu_postman_vars.json!')
