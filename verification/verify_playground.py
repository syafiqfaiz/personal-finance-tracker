from playwright.sync_api import sync_playwright

def verify_playground():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()

        # Navigate to the landing page
        page.goto("http://localhost:5173/welcome")

        # Click the "Try AI Demo" button
        page.get_by_role("button", name="Try AI Demo").click()

        # Verify we are on the playground page
        page.wait_for_url("**/playground")

        # Take a screenshot of the initial playground state
        page.screenshot(path="verification/playground_initial.png")

        # Try some interaction if possible (e.g. clicking a suggestion)
        # Note: Without an API key, the actual extraction won't work, but we can check the UI response to "no key" or just the input being populated

        # Find a suggestion button and click it
        suggestion_btn = page.get_by_role("button", name='"Lunch at McD 25"')
        if suggestion_btn.is_visible():
            suggestion_btn.click()

            # Take another screenshot after clicking suggestion
            page.screenshot(path="verification/playground_input_populated.png")

        browser.close()

if __name__ == "__main__":
    verify_playground()
