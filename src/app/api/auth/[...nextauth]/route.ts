import NextAuth from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials"
import bcrypt from 'bcryptjs';
import prisma from "@/lib/prisma"
import { authConfig } from "@/auth.config"

const handler = NextAuth({
    ...authConfig,
    providers: [
        CredentialsProvider({
            name: "Credentials",
            credentials: {
                email: { label: "Email", type: "email" },
                password: { label: "Password", type: "password" },
            },
            async authorize(credentials) {
                if (!credentials?.email || !credentials?.password) {
                    return null
                }

                const user = await prisma.user.findUnique({
                    where: { email: credentials.email as string },
                })

                if (!user) {
                    return null
                }

                // Check if user is verified
                if (!user.isVerified) {
                    throw new Error("Please verify your email before logging in")
                }

                const passwordMatch = await bcrypt.compare(credentials.password as string, user.password)

                if (!passwordMatch) {
                    return null
                }

                return {
                    id: user.id,
                    email: user.email,
                    username: user.username,
                }
            },
        }),
    ],
})

export { handler as GET, handler as POST }

