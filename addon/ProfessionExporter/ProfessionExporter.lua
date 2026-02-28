-- ProfessionExporter: Export known recipes to JSON for wow-professions
-- Slash command: /exportrecipes

local addonName = "ProfessionExporter"

-- Escape a string for JSON (quotes, backslashes, control chars)
local function jsonEscape(str)
    if not str then return "" end
    return (str:gsub("\\", "\\\\"):gsub('"', '\\"'):gsub("\n", "\\n"):gsub("\r", "\\r"):gsub("\t", "\\t"))
end

-- Build JSON array of recipe strings
local function buildRecipesJson(recipes)
    local parts = {}
    for i, name in ipairs(recipes) do
        parts[i] = '"' .. jsonEscape(name) .. '"'
    end
    return "[" .. table.concat(parts, ",") .. "]"
end

local function showExportFrame(jsonStr)
    if ProfessionExporterFrame then
        ProfessionExporterFrame:Show()
        ProfessionExporterFrame.editBox:SetText(jsonStr)
        ProfessionExporterFrame.editBox:HighlightText()
        return
    end

    local frame = CreateFrame("Frame", "ProfessionExporterFrame", UIParent)
    frame:SetSize(500, 400)
    frame:SetPoint("CENTER")
    frame:SetFrameStrata("DIALOG")
    -- Simple solid background (SetBackdrop not available in TBC Anniversary)
    local bg = frame:CreateTexture(nil, "BACKGROUND")
    bg:SetAllPoints(frame)
    bg:SetTexture("Interface\\Buttons\\WHITE8x8")
    bg:SetVertexColor(0.15, 0.15, 0.15, 0.95)
    frame:SetMovable(true)
    frame:EnableMouse(true)
    frame:RegisterForDrag("LeftButton")
    frame:SetScript("OnDragStart", frame.StartMoving)
    frame:SetScript("OnDragStop", frame.StopMovingOrSizing)

    local title = frame:CreateFontString(nil, "OVERLAY", "GameFontNormalLarge")
    title:SetPoint("TOP", 0, -16)
    title:SetText("Profession Exporter — Copy JSON")

    local scrollFrame = CreateFrame("ScrollFrame", "ProfessionExporterScrollFrame", frame, "UIPanelScrollFrameTemplate")
    scrollFrame:SetSize(460, 300)
    scrollFrame:SetPoint("CENTER", 0, -10)

    local editBox = CreateFrame("EditBox", nil, scrollFrame)
    editBox:SetMultiLine(true)
    editBox:SetWidth(460)
    editBox:SetHeight(400)
    editBox:SetFontObject(GameFontHighlight)
    editBox:SetAutoFocus(false)
    editBox:SetText(jsonStr)
    editBox:HighlightText()
    scrollFrame:SetScrollChild(editBox)

    local closeBtn = CreateFrame("Button", nil, frame, "UIPanelButtonTemplate")
    closeBtn:SetSize(100, 22)
    closeBtn:SetPoint("BOTTOM", 0, 16)
    closeBtn:SetText("Close")
    closeBtn:SetScript("OnClick", function()
        frame:Hide()
    end)

    frame.editBox = editBox
    frame:Show()
end

local function exportRecipes()
    local professionName, recipes

    -- 1. Try C_TradeSkillUI (TBC Anniversary / retail-style profession UI)
    if C_TradeSkillUI and C_TradeSkillUI.GetTradeSkillLine then
        local skillLineID, skillLineDisplayName = C_TradeSkillUI.GetTradeSkillLine()
        if skillLineDisplayName and skillLineDisplayName ~= "" then
            professionName = skillLineDisplayName
            recipes = {}
            local recipeIDs = C_TradeSkillUI.GetAllRecipeIDs and C_TradeSkillUI.GetAllRecipeIDs()
            if recipeIDs then
                for _, recipeID in pairs(recipeIDs) do
                    if type(recipeID) == "number" then
                        local info = C_TradeSkillUI.GetRecipeInfo and C_TradeSkillUI.GetRecipeInfo(recipeID)
                        if info and info.name then
                            table.insert(recipes, info.name)
                        end
                    end
                end
            end
        end
    end

    -- 2. Try legacy Trade Skill API (Alchemy, Blacksmithing, Tailoring, etc.)
    if not professionName and GetTradeSkillLine then
        local tradeskillName = GetTradeSkillLine()
        if tradeskillName and tradeskillName ~= "UNKNOWN" then
            professionName = tradeskillName
            recipes = {}
            local numSkills = GetNumTradeSkills and GetNumTradeSkills() or 0
            for i = 1, numSkills do
                local skillName, skillType = GetTradeSkillInfo(i)
                if skillName and skillType and skillType ~= "header" and skillType ~= "subheader" then
                    table.insert(recipes, skillName)
                end
            end
        end
    end

    -- 3. Try legacy Craft API (Engineering, Cooking, First Aid)
    if not professionName then
        local craftName
        if GetCraftDisplaySkillLine then
            craftName = GetCraftDisplaySkillLine()
        elseif GetCraftSkillLine and GetNumCrafts and GetNumCrafts() > 0 then
            craftName = GetCraftSkillLine(1)
        end
        if craftName and craftName ~= "UNKNOWN" and GetCraftInfo then
            professionName = craftName
            recipes = {}
            local numCrafts = GetNumCrafts and GetNumCrafts() or 0
            for i = 1, numCrafts do
                local recipeName, craftSubSpellName, craftType = GetCraftInfo(i)
                if recipeName and craftType and craftType ~= "header" and craftType ~= "subheader" then
                    table.insert(recipes, recipeName)
                end
            end
        end
    end

    if not professionName or not recipes then
        print("|cffff0000Profession Exporter:|r Open your profession window first (press 'P', click a profession like Alchemy or Engineering), then run /exportrecipes")
        return
    end

    local character = UnitName("player")
    local realm = GetRealmName()
    if not character or not realm then
        print("|cffff0000Profession Exporter:|r Could not get character or realm name.")
        return
    end

    local jsonStr = string.format(
        '{"character":"%s","realm":"%s","profession":"%s","recipes":%s}',
        jsonEscape(character),
        jsonEscape(realm),
        jsonEscape(professionName),
        buildRecipesJson(recipes)
    )

    showExportFrame(jsonStr)
    print("|cff00ff00Profession Exporter:|r Exported " .. #recipes .. " recipes. Copy from the window (Ctrl+A, Ctrl+C).")
end

SlashCmdList["PROFESSIONEXPORTER"] = function(msg)
    local ok, err = pcall(exportRecipes)
    if not ok then
        print("|cffff0000Profession Exporter:|r Error: " .. tostring(err))
    end
end
SLASH_PROFESSIONEXPORTER1 = "/exportrecipes"

local frame = CreateFrame("Frame")
frame:RegisterEvent("ADDON_LOADED")
frame:SetScript("OnEvent", function(self, event, name)
    if name == addonName then
        print("|cff00ff00Profession Exporter|r loaded. Type |cffffcc00/exportrecipes|r with your profession window open to export.")
        self:UnregisterEvent("ADDON_LOADED")
    end
end)
