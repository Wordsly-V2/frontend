import { describe, expect, it } from "vitest";
import {
    emptyStageForm,
    emptyUnitForm,
    recordToStageForm,
    recordToUnitForm,
    stageFormSchema,
    stageFormToRecord,
    unitFormSchema,
    unitFormToRecord,
} from "@/lib/admin-path/stage-form";

// Shapes copied from the seed (content/stages.json, content/units/a1/a1-03-food-and-drink.json).
const stage = {
    slug: "a1",
    cefr: "A1",
    order: 2,
    title: "Beginner",
    titleVi: "Sơ cấp",
    descriptionVi: "Gia đình, ăn uống, mua sắm, thời gian, nhà cửa; hiện tại đơn và hiện tại tiếp diễn.",
};
const unit = {
    slug: "a1-03-food-and-drink",
    stage: "a1",
    order: 3,
    title: "Food and drink",
    titleVi: "Đồ ăn thức uống",
    descriptionVi: "Món ăn và đồ uống quen thuộc, gọi món lịch sự, nói mình thích và không thích gì.",
    canDo: [
        "Tôi gọi tên được các món ăn, đồ uống quen thuộc.",
        "Tôi gọi được đồ uống, món ăn một cách lịch sự ở quán.",
        "Tôi nói được mình thích và không thích gì, và hỏi người khác.",
    ],
};

describe("stage form", () => {
    it("round-trips a stage unchanged, so saving it is a no-op", () => {
        const form = recordToStageForm(stage);
        expect(stageFormSchema.safeParse(form).success).toBe(true);
        expect(stageFormToRecord(form)).toEqual(stage);
    });

    it("drops an empty description instead of sending an empty string", () => {
        const bare: Record<string, unknown> = { ...stage };
        delete bare.descriptionVi;
        const form = recordToStageForm(bare);
        expect(stageFormToRecord({ ...form, descriptionVi: "  " })).toEqual(bare);
    });

    it("only accepts the six CEFR levels and a kebab-case slug", () => {
        const form = { ...emptyStageForm(7), slug: "C1 Plus", title: "t", titleVi: "t" };
        expect(form.order).toBe("7");
        const bad = stageFormSchema.safeParse({ ...form, cefr: "C2" });
        expect(bad.error?.issues.map((i) => i.path.join("."))).toEqual(["slug", "cefr"]);
    });
});

describe("unit form", () => {
    it("round-trips a unit unchanged, so saving it is a no-op", () => {
        const form = recordToUnitForm(unit);
        expect(unitFormSchema.safeParse(form).success).toBe(true);
        expect(unitFormToRecord(form)).toEqual(unit);
    });

    it("starts a new unit in the given stage and position, and needs a can-do", () => {
        const form = emptyUnitForm("c1", 13);
        expect(form).toMatchObject({ stage: "c1", order: "13" });
        const bad = unitFormSchema.safeParse({ ...form, slug: "x", title: "t", titleVi: "t" });
        expect(bad.error?.issues.map((i) => i.path.join("."))).toEqual(["canDo.0.text"]);
        expect(unitFormSchema.safeParse({ ...form, slug: "x", title: "t", titleVi: "t", canDo: [] }).success).toBe(false);
    });
});
