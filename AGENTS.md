# AGENTS.md

## Project Overview

The "Website Bán Đá Muối" (Salt Rock Sales Website) project is a complete B2C E-commerce platform. The project is designed to serve three main user groups: Public/Guest users, Registered Users, and Administrators (Admin). It provides core e-commerce functionalities such as product browsing, ordering, inventory management, and revenue tracking.

## System Architecture

The system architecture is divided into three major functional areas based on user roles:
1. **Front-end Public (Customer Area):** The public-facing interface for all users to explore products and perform basic shopping workflows.
2. **User Dashboard (Account Management):** A restricted area for registered and logged-in users to manage their personal information and track their purchases.
3. **Admin Dashboard (System Administration):** A secure area exclusively for store owners or administrators to operate and control all business activities on the website.

## Repository Structure

Based on the functional directories and UI modules mentioned in the analysis:
- `/home`, `/about`, `/contact`: Core public informational pages.
- `/product_detail`, `/cart_checkout`: Consumer shopping and checkout workflow modules.
- `/chatbot`: Automated customer support module.
- `/login`: User authentication module.
- `/account_dashboard`, `/account_profile`, `/account_orders`: User account management modules.
- `/admin_general`, `/admin_products`, `/admin_orders`, `/admin_customer`, `/admin_reviews`, `/admin_stock`, `/admin_statistic`: Administrative and management modules.

## Development Environment

*(Note: Specific tools, runtimes, frameworks, and dependencies are not mentioned in the provided analysis documents. Agents should refer to the actual codebase for this information.)*

## Coding Standards

*(Note: Specific coding conventions are not mentioned in the provided analysis documents. Agents must follow existing codebase styles and best practices.)*

## Agent Responsibilities

- Develop, maintain, and enhance the functionalities of the B2C E-commerce platform.
- Strictly implement features across the 3 defined areas (Public, User, Admin) according to the provided functional specifications.
- Support and improve user experience features, specifically the automated Chatbot integration.

## Agent Coding Rules

- Follow the existing 3-tier user architecture (Guest, User, Admin).
- Do not introduce new frameworks or technologies unless explicitly requested or present in the existing environment.
- Keep backward compatibility when modifying existing business flows.
- Update relevant tests when logic is changed, particularly for checkout and inventory management.

## Safe Modification Guidelines

- **Safe to modify:** UI/UX enhancements on public informative pages (Home, About, Contact), static content, and standard product display adjustments.
- **Requires caution:** Core business logic including the checkout process (`cart_checkout`), authentication (`login`), order management (`admin_orders`), and stock management (`admin_stock`). These directly impact business operations and revenue.

## Common Tasks for Agents

- Implement new e-commerce features for users or admins.
- Fix bugs in the shopping cart, checkout flow, or dashboard data rendering.
- Refactor UI modules to improve responsiveness and user experience.
- Write tests for order processing and user authentication.
- Improve project documentation and inline code comments.

## Constraints

- The system must strictly enforce access control and role boundaries among the 3 user groups (Public/Guest, User, Admin).
- Administrative functions (statistics, order and stock management) must be securely protected from unauthorized access.

## Notes for AI Agents

- The project prioritizes not only core e-commerce features but also enhanced user experience, specifically via the automated chatbot. Always consider user experience impact.
- Be mindful of the role-based access contexts; ensure that any functionality added to a dashboard verifies the user's role authorization correctly.
