import { systemRouter } from "./_core/systemRouter";
import { whatsappRouter } from "./whatsapp.router";
import { publicProcedure, router } from "./_core/trpc";
import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { ENV } from "./_core/env";
import {
  getAllOccupiedDates, addOccupiedDates, removeOccupiedDates,
  getAllOffers, getActiveOffer, createOffer, updateOffer, toggleOfferActive, deleteOffer,
} from "./db";

const ADMIN_PASSWORD = ENV.adminPassword;

/** Procedure that requires admin password in input */
const adminProcedure = publicProcedure
  .input(z.object({ password: z.string() }))
  .use(({ input, next }) => {
    if (input.password !== ADMIN_PASSWORD) {
      throw new TRPCError({ code: "UNAUTHORIZED", message: "Contraseña incorrecta" });
    }
    return next();
  });

export const appRouter = router({
  system: systemRouter,

  calendar: router({
    /** Public: get all occupied dates */
    getOccupiedDates: publicProcedure.query(async () => {
      const dates = await getAllOccupiedDates();
      return { dates };
    }),

    /** Admin: verify password */
    verifyPassword: publicProcedure
      .input(z.object({ password: z.string() }))
      .mutation(({ input }) => {
        if (input.password !== ADMIN_PASSWORD) {
          throw new TRPCError({ code: "UNAUTHORIZED", message: "Contraseña incorrecta" });
        }
        return { success: true };
      }),

    /** Admin: add occupied dates */
    addDates: adminProcedure
      .input(z.object({
        dates: z.array(z.string().regex(/^\d{4}-\d{2}-\d{2}$/)),
      }))
      .mutation(async ({ input }) => {
        const added = await addOccupiedDates(input.dates);
        return { added, total: (await getAllOccupiedDates()).length };
      }),

    /** Admin: remove occupied dates */
    removeDates: adminProcedure
      .input(z.object({
        dates: z.array(z.string().regex(/^\d{4}-\d{2}-\d{2}$/)),
      }))
      .mutation(async ({ input }) => {
        const removed = await removeOccupiedDates(input.dates);
        return { removed, total: (await getAllOccupiedDates()).length };
      }),
  }),

  offers: router({
    /** Public: get the currently active offer (for popup) */
    getActive: publicProcedure.query(async () => {
      const offer = await getActiveOffer();
      return { offer };
    }),

    /** Admin: get all offers */
    getAll: adminProcedure.query(async () => {
      const items = await getAllOffers();
      return { offers: items };
    }),

    /** Admin: create a new offer */
    create: adminProcedure
      .input(z.object({
        title: z.string().min(1, "El título es obligatorio"),
        description: z.string().min(1, "La descripción es obligatoria"),
        discount: z.string().optional(),
        imageUrl: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        const offer = await createOffer({
          title: input.title,
          description: input.description,
          discount: input.discount,
          imageUrl: input.imageUrl,
        });
        return { offer };
      }),

    /** Admin: update an existing offer */
    update: adminProcedure
      .input(z.object({
        id: z.number(),
        title: z.string().min(1).optional(),
        description: z.string().min(1).optional(),
        discount: z.string().optional(),
        imageUrl: z.string().nullable().optional(),
      }))
      .mutation(async ({ input }) => {
        const offer = await updateOffer(input.id, {
          title: input.title,
          description: input.description,
          discount: input.discount,
          imageUrl: input.imageUrl,
        });
        return { offer };
      }),

    /** Admin: toggle offer active/inactive */
    toggleActive: adminProcedure
      .input(z.object({
        id: z.number(),
        active: z.boolean(),
      }))
      .mutation(async ({ input }) => {
        const offer = await toggleOfferActive(input.id, input.active);
        return { offer };
      }),

    /** Admin: delete an offer */
    delete: adminProcedure
      .input(z.object({
        id: z.number(),
      }))
      .mutation(async ({ input }) => {
        const deleted = await deleteOffer(input.id);
        return { deleted };
      }),
  }),

  whatsapp: whatsappRouter,
});

export type AppRouter = typeof appRouter;
