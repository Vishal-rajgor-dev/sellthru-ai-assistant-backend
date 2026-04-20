const registerScriptTag = async (shop, accessToken, appUrl) => {
  try {
    // Delete any existing script tags first to avoid duplicates
    const listRes = await fetch(
      `https://${shop}/admin/api/2023-10/script_tags.json`,
      {
        headers: {
          'X-Shopify-Access-Token': accessToken,
          'Content-Type': 'application/json'
        }
      }
    );
    const listData = await listRes.json();

    // Delete all existing sellthru script tags
    if (listData.script_tags) {
      for (const tag of listData.script_tags) {
        if (tag.src.includes('sellthru') || tag.src.includes('ngrok') || tag.src.includes('widget')) {
          await fetch(
            `https://${shop}/admin/api/2023-10/script_tags/${tag.id}.json`,
            {
              method: 'DELETE',
              headers: { 'X-Shopify-Access-Token': accessToken }
            }
          );
          console.log('Deleted old script tag:', tag.id);
        }
      }
    }

    // Register config script
    await fetch(`https://${shop}/admin/api/2023-10/script_tags.json`, {
      method: 'POST',
      headers: {
        'X-Shopify-Access-Token': accessToken,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        script_tag: {
          event: 'onload',
          src: `${appUrl}/widget/config.js?shop=${shop}`
        }
      })
    });

    // Register widget script
    const res = await fetch(`https://${shop}/admin/api/2023-10/script_tags.json`, {
      method: 'POST',
      headers: {
        'X-Shopify-Access-Token': accessToken,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        script_tag: {
          event: 'onload',
          src: `${appUrl}/widget/widget.js`
        }
      })
    });

    const data = await res.json();
    console.log('Script tag result:', JSON.stringify(data));
    return data;

  } catch (err) {
    console.error('Script tag error:', err.message);
  }
};

module.exports = { registerScriptTag };