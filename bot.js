const { Telegraf } = require('telegraf');
const translate = require('google-translate-api-x');
require('dotenv').config();

const botToken = process.env.BOT_TOKEN;
const targetChannel = '@TrackingIsraeliGenocideAR';
const allowedUserId = 2124127983;

const bot = new Telegraf(botToken);
const mediaGroups = {};

bot.on("message", async (ctx) => {
    if (ctx.from && ctx.from.id === allowedUserId) {
        const mediaGroupId = ctx.message.media_group_id;

        // إذا كانت رسالة فيديو فقط مع نص
        if (ctx.message.video && !ctx.message.media_group_id) {
            const caption = ctx.message.caption ? await translate(ctx.message.caption, { to: 'ar' }) : null;
            await ctx.telegram.sendVideo(targetChannel, ctx.message.video.file_id, { caption: caption ? caption.text : undefined });
            return; // إرجاع بعد الإرسال لتجنب أي معالجة إضافية
        }

        // إذا كانت هناك مجموعة وسائط
        if (ctx.message.media_group_id) {
            if (!mediaGroups[mediaGroupId]) {
                mediaGroups[mediaGroupId] = {
                    media: [],
                    caption: null,
                    isSent: false,
                };

                setTimeout(async () => {
                    if (!mediaGroups[mediaGroupId].isSent) {
                        mediaGroups[mediaGroupId].isSent = true;
                        try {
                            await bot.telegram.sendMediaGroup(targetChannel, mediaGroups[mediaGroupId].media);
                            console.log("Media group sent successfully!");
                        } catch (error) {
                            console.error("Error sending media group:", error);
                        }
                    }
                }, 10000);
            }

            if (ctx.message.photo) {
                mediaGroups[mediaGroupId].media.push({
                    type: "photo",
                    media: ctx.message.photo[ctx.message.photo.length - 1].file_id,
                });
            } else if (ctx.message.video) {
                mediaGroups[mediaGroupId].media.push({
                    type: "video",
                    media: ctx.message.video.file_id,
                });
            }
            
            if (ctx.message.caption && !mediaGroups[mediaGroupId].caption) {
                const translated = await translate(ctx.message.caption, { to: 'ar' });
                mediaGroups[mediaGroupId].caption = translated.text;
                mediaGroups[mediaGroupId].media[0].caption = translated.text;  
            }
        }
    }
});

bot.launch();
console.log('Bot is running...');