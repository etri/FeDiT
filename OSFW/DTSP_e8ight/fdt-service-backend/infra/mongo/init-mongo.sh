#!/bin/bash
set -e

mongosh <<EOF

db = db.getSiblingDB('admin');
db.auth({ user: 'mongoadmin', pwd: 'ndxpro123!'});

ndxpro = db.getSiblingDB('ndxpro');

ndxpro.createUser({
  user:  'ndxpro',
  pwd: 'ndxpro123!',
  roles: [{
    role: 'readWrite',
    db: 'ndxpro'
  }]
});
EOF
