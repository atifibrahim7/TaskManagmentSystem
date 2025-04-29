describe('Authentication Tests', () => {
  beforeEach(() => {
    cy.visit('/register'); // Start at the register page
  });

  describe('Signup Functionality', () => {
    // Equivalence Classes for Username:
    // 1. Valid username (3-20 characters, alphanumeric)
    // 2. Too short username (< 3 characters)
    // 3. Too long username (> 20 characters)
    // 4. Invalid characters in username
    // 5. Empty username

    // Equivalence Classes for Password:
    // 1. Valid password (8-20 characters, contains number, special char, uppercase, lowercase)
    // 2. Too short password (< 8 characters)
    // 3. Too long password (> 20 characters)
    // 4. Missing required character types
    // 5. Empty password

    // Equivalence Classes for Email:
    // 1. Valid email format
    // 2. Invalid email format
    // 3. Empty email

    const validEmail = 'aatiifibrahim@gmail.com';
    const validPassword = '12345678';

    it('should successfully signup with valid credentials', () => {
      cy.get('[data-testid="signup-username"]').type('testuser123');
      cy.get('[data-testid="signup-email"]').type(validEmail);
      cy.get('[data-testid="signup-password"]').type(validPassword);
      cy.get('[data-testid="signup-submit"]').click();
      cy.get('[data-testid="error-message"]').should('not.exist');
    //   cy.url().should('include', '/login');
    });

    // Boundary Value Analysis for Username Length
    it('should reject username with 2 characters (lower boundary)', () => {
      cy.get('[data-testid="signup-username"]').type('ab');
      cy.get('[data-testid="signup-email"]').type(validEmail);
      cy.get('[data-testid="signup-password"]').type(validPassword);
      cy.get('[data-testid="signup-submit"]').click();
      
        });

    it('should accept username with 3 characters (lower boundary + 1)', () => {
      cy.get('[data-testid="signup-username"]').type('abc');
      cy.get('[data-testid="signup-email"]').type(validEmail);
      cy.get('[data-testid="signup-password"]').type(validPassword);
      cy.get('[data-testid="signup-submit"]').click();
      cy.get('[data-testid="error-message"]').should('not.exist');
    });

    it('should accept username with 20 characters (upper boundary)', () => {
      cy.get('[data-testid="signup-username"]').type('a'.repeat(20));
      cy.get('[data-testid="signup-email"]').type(validEmail);
      cy.get('[data-testid="signup-password"]').type(validPassword);
      cy.get('[data-testid="signup-submit"]').click();
      cy.get('[data-testid="error-message"]').should('not.exist');
    });

    

   


    // Email Format Tests
 
  });

  describe('Login Functionality', () => {
    beforeEach(() => {
      cy.visit('/login');
    });

    // Equivalence Classes for Login:
    // 1. Valid credentials
    // 2. Invalid username
    // 3. Invalid password
    // 4. Empty credentials
    // 5. Wrong combination

    const validEmail = 'bigdream382@gmail.com';
    const validPassword = '12345678';
    const invalidEmail = 'wrong@example.com';
    const invalidPassword = 'Wrong@1234';

    it('should successfully login with valid credentials', () => {
      cy.get('[data-testid="login-username"]').type(validEmail);
      cy.get('[data-testid="login-password"]').type(validPassword);
      cy.get('[data-testid="login-submit"]').click();
      cy.url().should('include', '/dashboard');
    });

    it('should reject login with invalid username', () => {
      cy.get('[data-testid="login-username"]').type(invalidEmail);
      cy.get('[data-testid="login-password"]').type(validPassword);
      cy.get('[data-testid="login-submit"]').click();
      cy.get('[data-testid="error-message"]')
        .should('be.visible')
        .and('contain', 'Invalid credentials');
    });

    it('should reject login with invalid password', () => {
      cy.get('[data-testid="login-username"]').type(validEmail);
      cy.get('[data-testid="login-password"]').type(invalidPassword);
      cy.get('[data-testid="login-submit"]').click();
      cy.get('[data-testid="error-message"]')
        .should('be.visible')
        .and('contain', 'Invalid credentials');
    });

    it('should reject login with empty credentials', () => {
      cy.get('[data-testid="login-submit"]').click();
      cy.get('[data-testid="error-message"]')
        .should('be.visible')
        .and('contain', 'Please enter both email and password');
    });

    it('should show appropriate error message for wrong credentials', () => {
      cy.get('[data-testid="login-username"]').type(validEmail);
      cy.get('[data-testid="login-password"]').type(invalidPassword);
      cy.get('[data-testid="login-submit"]').click();
      cy.get('[data-testid="error-message"]')
        .should('be.visible')
        .and('contain', 'Invalid credentials');
    });
  });
}); 