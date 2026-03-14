#!/bin/bash
set -e

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
BACKEND_DIR="$SCRIPT_DIR/backend"
FRONTEND_DIR="$SCRIPT_DIR/frontend"
VENV_DIR="$BACKEND_DIR/venv"

echo ""
echo "============================================"
echo "  Quantra - Test Management System Setup"
echo "============================================"
echo ""

# ─── Backend Setup ───────────────────────────────────────────────────────────

echo "[1/6] Creating Python virtual environment..."
cd "$BACKEND_DIR"
python3 -m venv "$VENV_DIR"

echo "[2/6] Installing Python dependencies..."
"$VENV_DIR/bin/pip" install --upgrade pip -q
"$VENV_DIR/bin/pip" install -r requirements.txt -q

echo "[3/6] Running database migrations..."
"$VENV_DIR/bin/python" manage.py migrate --run-syncdb

echo "[4/6] Creating superuser (admin/admin123)..."
"$VENV_DIR/bin/python" manage.py shell << 'PYEOF'
from django.contrib.auth.models import User

# Create admin superuser
if not User.objects.filter(username='admin').exists():
    admin = User.objects.create_superuser(
        username='admin',
        email='admin@quantra.dev',
        password='admin123',
        first_name='Admin',
        last_name='User',
    )
    print("Created superuser: admin / admin123")
else:
    admin = User.objects.get(username='admin')
    print("Superuser 'admin' already exists")

# Create a demo tester user
if not User.objects.filter(username='tester1').exists():
    tester = User.objects.create_user(
        username='tester1',
        email='tester1@quantra.dev',
        password='tester123',
        first_name='Alice',
        last_name='Tester',
    )
    print("Created user: tester1 / tester123")
else:
    tester = User.objects.get(username='tester1')
    print("User 'tester1' already exists")
PYEOF

echo "[5/6] Creating sample project data..."
"$VENV_DIR/bin/python" manage.py shell << 'PYEOF'
from django.contrib.auth.models import User
from apps.projects.models import Project, ProjectMember
from apps.tests.models import TestSuite, TestCase, TestRun, TestExecution

admin = User.objects.get(username='admin')
tester = User.objects.get(username='tester1')

# Create demo project
project, created = Project.objects.get_or_create(
    name='E-Commerce Platform',
    defaults={
        'description': 'Testing suite for the e-commerce web application',
        'created_by': admin,
    }
)

if created:
    print(f"Created project: {project.name}")
    ProjectMember.objects.create(project=project, user=admin, role='admin')
    ProjectMember.objects.create(project=project, user=tester, role='tester')

    # Create test suites
    auth_suite = TestSuite.objects.create(
        project=project,
        name='Authentication',
        description='Login, registration, and auth flow tests',
        created_by=admin,
    )
    checkout_suite = TestSuite.objects.create(
        project=project,
        name='Checkout',
        description='Shopping cart and payment flow tests',
        created_by=admin,
    )
    api_suite = TestSuite.objects.create(
        project=project,
        name='API Tests',
        description='REST API endpoint tests',
        created_by=admin,
    )

    # Create test cases for auth suite
    auth_cases = [
        {
            'title': 'Login with valid credentials',
            'description': 'Verify user can login with correct username and password',
            'steps': '1. Navigate to /login\n2. Enter valid username\n3. Enter valid password\n4. Click Login',
            'expected_result': 'User is redirected to dashboard',
            'priority': 'critical',
        },
        {
            'title': 'Login with invalid password',
            'description': 'Verify error message shown for wrong password',
            'steps': '1. Navigate to /login\n2. Enter valid username\n3. Enter wrong password\n4. Click Login',
            'expected_result': 'Error message "Invalid credentials" is displayed',
            'priority': 'high',
        },
        {
            'title': 'User registration with valid data',
            'description': 'Verify new user registration flow',
            'steps': '1. Navigate to /register\n2. Fill in all required fields\n3. Click Register',
            'expected_result': 'Account created and user is logged in',
            'priority': 'critical',
        },
        {
            'title': 'Password reset email flow',
            'description': 'Verify password reset email is sent',
            'steps': '1. Navigate to /forgot-password\n2. Enter registered email\n3. Click Send Reset Link',
            'expected_result': 'Confirmation message displayed and email sent',
            'priority': 'medium',
        },
    ]

    for case_data in auth_cases:
        TestCase.objects.create(suite=auth_suite, created_by=admin, **case_data)

    # Create test cases for checkout suite
    checkout_cases = [
        {
            'title': 'Add product to cart',
            'description': 'Verify product can be added to shopping cart',
            'steps': '1. Browse to product page\n2. Select quantity\n3. Click Add to Cart',
            'expected_result': 'Product added to cart, cart count incremented',
            'priority': 'critical',
        },
        {
            'title': 'Complete checkout with credit card',
            'description': 'Verify end-to-end purchase flow',
            'steps': '1. Add item to cart\n2. Click Checkout\n3. Enter shipping details\n4. Enter payment info\n5. Place order',
            'expected_result': 'Order confirmed with order ID displayed',
            'priority': 'critical',
        },
        {
            'title': 'Apply valid discount coupon',
            'description': 'Verify coupon code reduces total price',
            'steps': '1. Add item to cart\n2. Enter coupon code SAVE10\n3. Click Apply',
            'expected_result': '10% discount applied to cart total',
            'priority': 'high',
        },
    ]

    for case_data in checkout_cases:
        TestCase.objects.create(suite=checkout_suite, created_by=admin, **case_data)

    # Create API test cases
    api_cases = [
        {
            'title': 'GET /api/products returns 200',
            'description': 'Verify products list endpoint',
            'steps': '1. Send GET request to /api/products/\n2. Check response status',
            'expected_result': 'HTTP 200 with paginated product list',
            'priority': 'high',
        },
        {
            'title': 'POST /api/orders creates order',
            'description': 'Verify order creation via API',
            'steps': '1. Authenticate with valid token\n2. POST to /api/orders/ with valid payload',
            'expected_result': 'HTTP 201 with created order data',
            'priority': 'critical',
        },
    ]

    for case_data in api_cases:
        TestCase.objects.create(suite=api_suite, created_by=admin, **case_data)

    # Create test runs
    run1 = TestRun.objects.create(
        project=project,
        name='Sprint 1 Smoke Tests',
        description='Basic smoke test pass for sprint 1 release',
        status='completed',
        created_by=admin,
    )

    run2 = TestRun.objects.create(
        project=project,
        name='Regression Test - v2.0',
        description='Full regression suite for v2.0 release',
        status='in_progress',
        created_by=admin,
    )

    # Add cases to run1 and set execution statuses
    auth_case_objs = list(TestCase.objects.filter(suite=auth_suite))
    checkout_case_objs = list(TestCase.objects.filter(suite=checkout_suite))

    exec_statuses = ['passed', 'passed', 'passed', 'failed', 'passed', 'passed', 'failed']
    all_cases = auth_case_objs + checkout_case_objs

    for i, case in enumerate(all_cases):
        st = exec_statuses[i] if i < len(exec_statuses) else 'passed'
        TestExecution.objects.create(
            run=run1,
            test_case=case,
            status=st,
            executed_by=tester if st != 'pending' else None,
            notes='Verified OK' if st == 'passed' else 'Bug filed: TC-' + str(i+1),
        )

    # Add all cases to run2 as pending
    for suite in [auth_suite, checkout_suite, api_suite]:
        for case in TestCase.objects.filter(suite=suite):
            TestExecution.objects.create(run=run2, test_case=case, status='pending')

    print(f"Created {TestSuite.objects.filter(project=project).count()} suites")
    print(f"Created {TestCase.objects.filter(suite__project=project).count()} test cases")
    print(f"Created 2 test runs with executions")
else:
    print(f"Project '{project.name}' already exists, skipping demo data")

print("\nSample data setup complete!")
PYEOF

# ─── Frontend Setup ───────────────────────────────────────────────────────────

echo "[6/6] Installing frontend dependencies..."
cd "$FRONTEND_DIR"
if command -v npm &> /dev/null; then
    npm install --silent
    echo "Frontend dependencies installed"
else
    echo "WARNING: npm not found. Please install Node.js and run 'npm install' in $FRONTEND_DIR"
fi

# ─── Done ─────────────────────────────────────────────────────────────────────

echo ""
echo "============================================"
echo "  Setup Complete!"
echo "============================================"
echo ""
echo "To start the backend:"
echo "  cd $BACKEND_DIR"
echo "  source venv/bin/activate"
echo "  python manage.py runserver"
echo ""
echo "To start the frontend (in a new terminal):"
echo "  cd $FRONTEND_DIR"
echo "  npm run dev"
echo ""
echo "Then open: http://localhost:5173"
echo ""
echo "Login credentials:"
echo "  Admin:  admin / admin123"
echo "  Tester: tester1 / tester123"
echo ""
echo "Django Admin: http://localhost:8000/admin"
echo ""
